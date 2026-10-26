/**
 * Offensive security tests (black box, real HTTP) for /api/v1/admin/payments.
 * Real controller + service + repository + floor layout + JWT guard +
 * throttler on the local test PostgreSQL (shamell-postgres-test), seeded with
 * thousands of real payment rows. Nothing is mocked.
 *
 * A failure here is not a broken test: it is an abuse path in the code.
 * Run: npm run test:db:up && npm run test:integration:local
 */
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { resolveJwtSecret } from '@app/common/config/jwt-secret.util';
import { LocalTestDatabase } from '@test-support/database/local-test-database';
import {
  ADMIN_PAYMENTS_TABLES,
  SEEDED_PAY_TOKEN_HASH,
  seedPaymentsVolume,
  type SeededPayments,
} from '@test-support/modules/admin-payments/fixtures/admin-payments-db.fixtures';
import { createRealAdminPaymentsHttpApp } from '@test-support/modules/admin-payments/harnesses/admin-payments-real-http-app';
import { seedUser } from '@test-support/modules/auth/fixtures/auth-db.fixtures';

const run = process.env.AUTH_INTEGRATION === '1';

const LIST = '/api/v1/admin/payments';
const BADGE = '/api/v1/admin/payments/badge';
const detail = (flow: string, id: string) =>
  `/api/v1/admin/payments/${flow}/${encodeURIComponent(id)}`;

const VENUE_ROWS = 5_000;
const FIXED_ROWS = 2_000;

type ListBody = {
  items: Array<{ id: string; flow: string }>;
  meta: { totalItems: number };
};
const listOf = (res: request.Response) => res.body as ListBody;

(run ? describe : describe.skip)(
  'Admin payments — security (real HTTP + DB)',
  () => {
    jest.setTimeout(120_000);

    const db = new LocalTestDatabase();
    const jwt = new JwtService({ secret: resolveJwtSecret() });
    let app: INestApplication<App>;
    let seed: SeededPayments;
    let adminToken: string;
    let adminPayload: Record<string, unknown>;
    let clientToken: string;

    const http = () => request(app.getHttpServer());
    const asAdmin = (path: string) =>
      http().get(path).set('Authorization', `Bearer ${adminToken}`);

    beforeAll(async () => {
      await db.start();
      await db.truncate(...ADMIN_PAYMENTS_TABLES);
      seed = await seedPaymentsVolume(db.prisma, {
        venue: VENUE_ROWS,
        fixed: FIXED_ROWS,
      });

      const admin = await seedUser(db.prisma, {
        email: 'admin-payments@shamell.test',
        role: 'ADMIN',
      });
      adminPayload = {
        sub: admin.id,
        email: admin.email,
        role: 'ADMIN',
        permissions: [],
      };
      adminToken = await jwt.signAsync(adminPayload);

      // The victim customer has an account: it must still not reach admin data.
      const client = await seedUser(db.prisma, {
        email: seed.victimEmail,
        role: 'CLIENT',
      });
      clientToken = await jwt.signAsync({
        sub: client.id,
        email: client.email,
        role: 'CLIENT',
        permissions: [],
      });
    });

    afterAll(async () => {
      await db.stop();
    });

    describe('Privilege escalation on /admin/payments/*', () => {
      beforeAll(async () => {
        ({ app } = await createRealAdminPaymentsHttpApp());
      });
      afterAll(() => app.close());

      const routes = () => [
        LIST,
        BADGE,
        detail('VENUE_SEAT', seed.victimVenueId),
      ];

      it('rejects every route without a token (401)', async () => {
        for (const path of routes()) {
          expect((await http().get(path)).status).toBe(401);
        }
      });

      it('rejects a non-Bearer authorization scheme (401)', async () => {
        const res = await http()
          .get(LIST)
          .set('Authorization', `Basic ${adminToken}`);
        expect(res.status).toBe(401);
      });

      it('rejects a token with an altered signature (401)', async () => {
        const [header, payload] = adminToken.split('.');
        const res = await http()
          .get(LIST)
          .set('Authorization', `Bearer ${header}.${payload}.firma-invalida`);
        expect(res.status).toBe(401);
      });

      it('rejects a token with alg=none (401)', async () => {
        const header = Buffer.from(
          JSON.stringify({ alg: 'none', typ: 'JWT' }),
        ).toString('base64url');
        const payload = Buffer.from(JSON.stringify(adminPayload)).toString(
          'base64url',
        );
        const res = await http()
          .get(LIST)
          .set('Authorization', `Bearer ${header}.${payload}.`);
        expect(res.status).toBe(401);
      });

      it('rejects a token signed with another secret (401)', async () => {
        const forged = await new JwtService({
          secret: 'attacker-secret',
        }).signAsync(adminPayload);
        const res = await http()
          .get(LIST)
          .set('Authorization', `Bearer ${forged}`);
        expect(res.status).toBe(401);
      });

      it('rejects an expired admin token (401)', async () => {
        const expired = await jwt.signAsync({
          ...adminPayload,
          exp: Math.floor(Date.now() / 1000) - 60,
        });
        const res = await http()
          .get(LIST)
          .set('Authorization', `Bearer ${expired}`);
        expect(res.status).toBe(401);
      });

      it('rejects a regular client on every route (403), even for their own payment (IDOR)', async () => {
        for (const path of routes()) {
          const res = await http()
            .get(path)
            .set('Authorization', `Bearer ${clientToken}`);
          expect(res.status).toBe(403);
        }
      });

      it('does not trust role claims: token says ADMIN but the DB user is CLIENT (401)', async () => {
        const client = await db.prisma.user.findUniqueOrThrow({
          where: { email: seed.victimEmail },
        });
        const lying = await jwt.signAsync({
          ...adminPayload,
          sub: client.id,
          role: 'SUPER_ADMIN',
        });
        const res = await http()
          .get(detail('VENUE_SEAT', seed.victimVenueId))
          .set('Authorization', `Bearer ${lying}`);
        expect(res.status).toBe(401);
      });

      it('rejects a valid token of an admin that no longer exists (401)', async () => {
        const ghost = await seedUser(db.prisma, {
          email: 'ghost-payments@shamell.test',
          role: 'ADMIN',
        });
        const token = await jwt.signAsync({ ...adminPayload, sub: ghost.id });
        await db.prisma.user.delete({ where: { id: ghost.id } });
        const res = await http()
          .get(LIST)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(401);
      });

      it('accepts a genuine ADMIN token and sees the whole seeded volume (200)', async () => {
        const res = await asAdmin(LIST);
        expect(res.status).toBe(200);
        expect(listOf(res).meta.totalItems).toBe(VENUE_ROWS + FIXED_ROWS);
      });
    });

    describe('Mass assignment / parameter pollution on query DTOs', () => {
      beforeAll(async () => {
        ({ app } = await createRealAdminPaymentsHttpApp());
      });
      afterAll(() => app.close());

      it.each([
        `${LIST}?isPaid=true`,
        `${LIST}?role=SUPER_ADMIN`,
        `${LIST}?userId=1`,
        `${BADGE}?since=0&status=PAID`,
      ])(
        'rejects unknown query fields %s (400, forbidNonWhitelisted)',
        async (path) => {
          expect((await asAdmin(path)).status).toBe(400);
        },
      );

      it.each([
        `${LIST}?flow=VENUE_SEAT&flow=FIXED_TICKET`,
        `${LIST}?status=PAID&status=PENDING`,
        `${LIST}?q=a&q=b`,
      ])('rejects repeated (array) parameters %s (400)', async (path) => {
        expect((await asAdmin(path)).status).toBe(400);
      });
    });

    describe('Injection & toxic payloads', () => {
      beforeAll(async () => {
        ({ app } = await createRealAdminPaymentsHttpApp());
      });
      afterAll(() => app.close());

      it.each([
        "' OR '1'='1",
        "x'; DROP TABLE venue_seat_reservations; --",
        "' UNION SELECT 'VENUE_SEAT', id, now() FROM users --",
        '<script>alert(1)</script>',
      ])(
        'search q=%s is a literal: 200 with zero rows, never a dump',
        async (q) => {
          const res = await asAdmin(`${LIST}?q=${encodeURIComponent(q)}`);
          expect(res.status).toBe(200);
          expect(listOf(res).meta.totalItems).toBe(0);
        },
      );

      it('tables survive the DROP TABLE attempt', async () => {
        expect(await db.prisma.venueSeatReservation.count()).toBe(VENUE_ROWS);
      });

      it.each(['%', '_', '%%%'])(
        'LIKE wildcard q=%s is matched literally (does not dump every customer)',
        async (q) => {
          const res = await asAdmin(`${LIST}?q=${encodeURIComponent(q)}`);
          expect(res.status).toBe(200);
          expect(listOf(res).meta.totalItems).toBe(0);
        },
      );

      it('a legitimate search still finds the customer', async () => {
        const res = await asAdmin(`${LIST}?q=customer42@load.test`);
        expect(res.status).toBe(200);
        expect(listOf(res).meta.totalItems).toBe(1);
      });

      it.each([
        `flow=${encodeURIComponent("VENUE_SEAT' OR '1'='1")}`,
        `status=${encodeURIComponent("PAID'::text OR 1=1 --")}`,
        `from=${encodeURIComponent("2020-01-01'; DROP TABLE users; --")}`,
        `to=${encodeURIComponent('1 OR 1=1')}`,
      ])('rejects malicious enum/date filter %s (400)', async (qs) => {
        expect((await asAdmin(`${LIST}?${qs}`)).status).toBe(400);
      });

      it('rejects an oversized search string (400), never 500', async () => {
        const res = await asAdmin(`${LIST}?q=${'A'.repeat(5_000)}`);
        expect(res.status).toBe(400);
      });

      it.each([
        ['page', '100000000000000000000'],
        ['page', '-1'],
        ['page', '1.5'],
        ['limit', '101'],
        ['limit', '0'],
        ['limit', 'NaN'],
      ])('rejects out-of-range pagination %s=%s (400)', async (key, value) => {
        expect((await asAdmin(`${LIST}?${key}=${value}`)).status).toBe(400);
      });

      it.each(['100000000000000000000', '-5', 'abc', '1e3000'])(
        'rejects a hostile badge since=%s (400), never 500',
        async (since) => {
          expect((await asAdmin(`${BADGE}?since=${since}`)).status).toBe(400);
        },
      );

      it.each([
        ['CLASS_PACKAGE', 'valid-looking'],
        ["VENUE_SEAT' OR '1'='1", 'x'],
        ['__proto__', 'x'],
      ])('rejects an unsupported detail flow %s (400)', async (flow, id) => {
        expect((await asAdmin(detail(flow, id))).status).toBe(400);
      });

      it.each([
        "' OR 1=1 --",
        '../../users',
        'A'.repeat(4_000),
        '00000000-0000-0000-0000-000000000000',
      ])(
        'detail with hostile id %s never leaks or 500s (400/404)',
        async (id) => {
          const res = await asAdmin(detail('VENUE_SEAT', id));
          expect([400, 404]).toContain(res.status);
        },
      );
    });

    describe('Sensitive data exposure', () => {
      beforeAll(async () => {
        ({ app } = await createRealAdminPaymentsHttpApp());
      });
      afterAll(() => app.close());

      it('list and detail never expose payTokenHash', async () => {
        const list = await asAdmin(`${LIST}?flow=VENUE_SEAT&limit=100`);
        const one = await asAdmin(detail('VENUE_SEAT', seed.victimVenueId));

        expect(list.status).toBe(200);
        expect(one.status).toBe(200);
        expect(list.text).not.toContain(SEEDED_PAY_TOKEN_HASH);
        expect(one.text).not.toContain(SEEDED_PAY_TOKEN_HASH);
        expect(list.text).not.toContain('payTokenHash');
        expect(one.text).not.toContain('payTokenHash');
      });

      it('error responses do not leak SQL or stack traces', async () => {
        const res = await asAdmin(detail('VENUE_SEAT', "' OR 1=1 --"));
        expect(res.text).not.toMatch(/prisma|SELECT|stack|at \w+ \(/i);
      });
    });

    describe('Rate limiting on admin payments (stolen-token scraping)', () => {
      beforeAll(async () => {
        ({ app } = await createRealAdminPaymentsHttpApp());
      });
      afterAll(() => app.close());

      it('allows 120 badge polls per minute and blocks the 121st with 429', async () => {
        const statuses: number[] = [];
        for (let i = 0; i < 121; i++) {
          statuses.push((await asAdmin(`${BADGE}?since=0`)).status);
        }
        expect(statuses.slice(0, 120)).toEqual(Array(120).fill(200));
        expect(statuses[120]).toBe(429);
      });
    });

    describe('Security headers (Helmet)', () => {
      beforeAll(async () => {
        ({ app } = await createRealAdminPaymentsHttpApp());
      });
      afterAll(() => app.close());

      it('responds with the minimum security headers', async () => {
        const res = await http().get(LIST);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-frame-options']).toBeDefined();
        expect(res.headers['strict-transport-security']).toBeDefined();
        expect(res.headers['x-powered-by']).toBeUndefined();
      });
    });
  },
);
