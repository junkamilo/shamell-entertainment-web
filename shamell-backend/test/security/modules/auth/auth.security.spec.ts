/**
 * Offensive security tests (black box, real HTTP) for /api/v1/auth.
 * Real AuthService + AuthRepository + JWT + guards + throttler on the local
 * test PostgreSQL (shamell-postgres-test). Only mail is faked.
 *
 * A failure here is not a broken test: it is an abuse path in the code.
 * Run: npm run test:db:up && npm run test:integration:local
 */
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import type { App } from 'supertest/types';
import { resolveJwtSecret } from '@app/common/config/jwt-secret.util';
import { sha256Hex } from '@app/modules/auth/utils/auth-crypto.util';
import { LocalTestDatabase } from '@test-support/database/local-test-database';
import {
  STAFF_PASSWORD,
  seedUser,
} from '@test-support/modules/auth/fixtures/auth-db.fixtures';
import {
  createRealAuthHttpApp,
  type FakeMail,
} from '@test-support/modules/auth/harnesses/auth-real-http-app';

const run = process.env.AUTH_INTEGRATION === '1';

const LOGIN = '/api/v1/auth/admin/login';
const INVITE = '/api/v1/auth/admin/invite';
const VERIFY = '/api/v1/auth/admin/invite/verify';
const FORGOT = '/api/v1/auth/forgot-password';
const RESET = '/api/v1/auth/reset-password';

const SUPER_EMAIL = 'super@shamell.test';

type AuthResponseBody = {
  message: string;
  resetLink?: string;
  accessToken: string;
  user: { role: string; permissions: string[] };
};
const bodyOf = (res: request.Response) => res.body as AuthResponseBody;

(run ? describe : describe.skip)('Auth — security (real HTTP + DB)', () => {
  jest.setTimeout(30_000);

  const db = new LocalTestDatabase();
  const jwt = new JwtService({ secret: resolveJwtSecret() });
  let app: INestApplication<App>;
  let mail: FakeMail;

  /** Fresh app (fresh throttler counters) and clean auth tables per block. */
  async function resetWorld(): Promise<{ superAdminId: string }> {
    await db.truncate('admin_invites', 'users');
    ({ app, mail } = await createRealAuthHttpApp());
    const superAdmin = await seedUser(db.prisma, { email: SUPER_EMAIL });
    return { superAdminId: superAdmin.id };
  }

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    await db.start();
  });

  afterAll(async () => {
    await db.stop();
  });

  describe('Brute force / rate limiting on POST /auth/admin/login', () => {
    beforeAll(resetWorld);
    afterAll(() => app.close());

    it('allows 10 failed attempts per minute and blocks the 11th with 429', async () => {
      const statuses: number[] = [];
      for (let i = 0; i < 11; i++) {
        const res = await http()
          .post(LOGIN)
          .send({ email: SUPER_EMAIL, password: 'wrong-password' });
        statuses.push(res.status);
      }

      expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401));
      expect(statuses[10]).toBe(429);
    });

    it('keeps blocking even with the correct password once the limit is hit', async () => {
      const res = await http()
        .post(LOGIN)
        .send({ email: SUPER_EMAIL, password: STAFF_PASSWORD });
      expect(res.status).toBe(429);
    });
  });

  describe('JWT tampering on the protected POST /auth/admin/invite', () => {
    let superAdminId: string;
    const body = { email: 'nuevo@shamell.test', fullName: 'Nuevo Admin' };

    beforeAll(async () => {
      ({ superAdminId } = await resetWorld());
    });
    afterAll(() => app.close());

    const superPayload = () => ({
      sub: superAdminId,
      email: SUPER_EMAIL,
      role: 'SUPER_ADMIN',
      permissions: ['admin.invite'],
    });

    const invite = (token?: string) => {
      const req = http().post(INVITE).send(body);
      return token ? req.set('Authorization', `Bearer ${token}`) : req;
    };

    it('rejects a request without token (401)', async () => {
      expect((await invite()).status).toBe(401);
    });

    it('rejects a token with an altered signature (401)', async () => {
      const [header, payload] = (await jwt.signAsync(superPayload())).split(
        '.',
      );
      expect((await invite(`${header}.${payload}.firma-invalida`)).status).toBe(
        401,
      );
    });

    it('rejects a token with alg=none (401)', async () => {
      const header = Buffer.from(
        JSON.stringify({ alg: 'none', typ: 'JWT' }),
      ).toString('base64url');
      const payload = Buffer.from(JSON.stringify(superPayload())).toString(
        'base64url',
      );
      expect((await invite(`${header}.${payload}.`)).status).toBe(401);
    });

    it('rejects a token signed with another secret (401)', async () => {
      const forged = await new JwtService({
        secret: 'attacker-secret',
      }).signAsync(superPayload());
      expect((await invite(forged)).status).toBe(401);
    });

    it('rejects an expired token (401)', async () => {
      const expired = await jwt.signAsync({
        ...superPayload(),
        exp: Math.floor(Date.now() / 1000) - 60,
      });
      expect((await invite(expired)).status).toBe(401);
    });

    it('rejects a valid token whose role is not staff (403)', async () => {
      const client = await seedUser(db.prisma, {
        email: 'cliente@shamell.test',
        role: 'CLIENT',
      });
      const token = await jwt.signAsync({
        ...superPayload(),
        sub: client.id,
        role: 'CLIENT',
      });
      expect((await invite(token)).status).toBe(403);
    });

    it('does not trust role claims: token says SUPER_ADMIN but the DB user is ADMIN (403)', async () => {
      const admin = await seedUser(db.prisma, {
        email: 'admin@shamell.test',
        role: 'ADMIN',
      });
      const token = await jwt.signAsync({ ...superPayload(), sub: admin.id });
      expect((await invite(token)).status).toBe(403);
    });

    it('rejects a valid token of a user that no longer exists (401)', async () => {
      const ghost = await seedUser(db.prisma, { email: 'ghost@shamell.test' });
      const token = await jwt.signAsync({ ...superPayload(), sub: ghost.id });
      await db.prisma.user.delete({ where: { id: ghost.id } });
      expect((await invite(token)).status).toBe(401);
    });

    it('accepts a genuine SUPER_ADMIN token (201) and mails the code', async () => {
      const res = await invite(await jwt.signAsync(superPayload()));
      expect(res.status).toBe(201);
      expect(mail.lastInviteCode(body.email)).toMatch(/^\d{6}$/);
    });
  });

  describe('Injection on the login DTO', () => {
    beforeAll(resetWorld);
    afterAll(() => app.close());

    it.each([
      "' OR '1'='1",
      "admin'--",
      '{"$ne": null}',
      '<script>alert(1)</script>',
    ])(
      'rejects malicious email %s with 400 (validation), never 500',
      async (payload) => {
        const res = await http()
          .post(LOGIN)
          .send({ email: payload, password: 'whatever-123' });
        expect(res.status).toBe(400);
      },
    );

    it('rejects an operator object instead of a string (400)', async () => {
      const res = await http()
        .post(LOGIN)
        .send({ email: { $ne: null }, password: { $ne: null } });
      expect(res.status).toBe(400);
    });

    it('does not authenticate a SQL-injection password against a real user (401)', async () => {
      const res = await http()
        .post(LOGIN)
        .send({ email: SUPER_EMAIL, password: "' OR '1'='1" });
      expect(res.status).toBe(401);
    });

    it('rejects extra fields such as role escalation (400, forbidNonWhitelisted)', async () => {
      const res = await http().post(LOGIN).send({
        email: SUPER_EMAIL,
        password: STAFF_PASSWORD,
        role: 'SUPER_ADMIN',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('User enumeration on login', () => {
    beforeAll(resetWorld);
    afterAll(() => app.close());

    it('returns the same status and message for unknown email and wrong password', async () => {
      const unknown = await http()
        .post(LOGIN)
        .send({ email: 'no-existe@shamell.test', password: 'cualquiera-123' });
      const wrong = await http()
        .post(LOGIN)
        .send({ email: SUPER_EMAIL, password: 'incorrecta-123' });

      expect(unknown.status).toBe(401);
      expect(wrong.status).toBe(401);
      expect(bodyOf(unknown).message).toBe(bodyOf(wrong).message);
    });

    it('takes a similar time for unknown email and wrong password (timing leak)', async () => {
      const time = async (email: string) => {
        const start = process.hrtime.bigint();
        await http().post(LOGIN).send({ email, password: 'incorrecta-123' });
        return Number(process.hrtime.bigint() - start) / 1e6;
      };
      const median = (xs: number[]) =>
        [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

      // 2 requests already used above; 8 more stays under the 10/min limit.
      const unknown: number[] = [];
      const wrong: number[] = [];
      for (let i = 0; i < 4; i++) {
        unknown.push(await time('no-existe@shamell.test'));
        wrong.push(await time(SUPER_EMAIL));
      }

      // Wrong password runs bcrypt; unknown email must not be measurably faster.
      expect(Math.abs(median(unknown) - median(wrong))).toBeLessThan(30);
    });
  });

  describe('Password reset tokens are single use', () => {
    beforeAll(resetWorld);
    afterAll(() => app.close());

    async function requestResetToken(email: string): Promise<string> {
      const res = await http().post(FORGOT).send({ email });
      expect(res.status).toBe(200);
      const link = String(bodyOf(res).resetLink);
      return decodeURIComponent(new URL(link).searchParams.get('token') ?? '');
    }

    it('a used reset token cannot be reused, and only the new password works', async () => {
      const token = await requestResetToken(SUPER_EMAIL);

      const first = await http()
        .post(RESET)
        .send({ token, newPassword: 'NuevaClave123!' });
      expect(first.status).toBe(200);

      const reuse = await http()
        .post(RESET)
        .send({ token, newPassword: 'OtraClave123!' });
      expect(reuse.status).toBe(401);

      const oldLogin = await http()
        .post(LOGIN)
        .send({ email: SUPER_EMAIL, password: STAFF_PASSWORD });
      expect(oldLogin.status).toBe(401);

      const newLogin = await http()
        .post(LOGIN)
        .send({ email: SUPER_EMAIL, password: 'NuevaClave123!' });
      expect(newLogin.status).toBe(200);
    });

    it('an expired reset token is rejected (401)', async () => {
      const token = await requestResetToken(SUPER_EMAIL);
      await db.prisma.user.update({
        where: { email: SUPER_EMAIL },
        data: { passwordResetExpiresAt: new Date(Date.now() - 1_000) },
      });

      const res = await http()
        .post(RESET)
        .send({ token, newPassword: 'NuevaClave456!' });
      expect(res.status).toBe(401);
    });

    it('does not reveal whether an email exists (same message, no link)', async () => {
      const res = await http()
        .post(FORGOT)
        .send({ email: 'no-existe@shamell.test' });
      expect(res.status).toBe(200);
      expect(bodyOf(res).resetLink).toBeUndefined();
      expect(bodyOf(res).message).toBe(
        'If this email exists, a secure recovery link has been sent.',
      );
    });
  });

  describe('Admin invite codes (6 digits) are single use', () => {
    let superAdminId: string;
    const NEW_ADMIN = 'invitado@shamell.test';

    beforeAll(async () => {
      ({ superAdminId } = await resetWorld());
    });
    afterAll(() => app.close());

    it('full flow: login → invite → wrong code 401 → verify 201 → reuse 401 → new admin logs in without invite permission', async () => {
      const login = await http()
        .post(LOGIN)
        .send({ email: SUPER_EMAIL, password: STAFF_PASSWORD });
      expect(login.status).toBe(200);

      const inviteRes = await http()
        .post(INVITE)
        .set('Authorization', `Bearer ${bodyOf(login).accessToken}`)
        .send({ email: NEW_ADMIN, fullName: 'Admin Invitado' });
      expect(inviteRes.status).toBe(201);
      const code = mail.lastInviteCode(NEW_ADMIN);

      const wrongCode = code === '000000' ? '111111' : '000000';
      const wrong = await http().post(VERIFY).send({
        email: NEW_ADMIN,
        code: wrongCode,
        password: 'ClaveAdmin123!',
      });
      expect(wrong.status).toBe(401);

      const ok = await http()
        .post(VERIFY)
        .send({ email: NEW_ADMIN, code, password: 'ClaveAdmin123!' });
      expect(ok.status).toBe(201);

      const reuse = await http()
        .post(VERIFY)
        .send({ email: NEW_ADMIN, code, password: 'OtraClave123!' });
      expect(reuse.status).toBe(401);

      const adminLogin = await http()
        .post(LOGIN)
        .send({ email: NEW_ADMIN, password: 'ClaveAdmin123!' });
      expect(adminLogin.status).toBe(200);
      expect(bodyOf(adminLogin).user.role).toBe('ADMIN');
      expect(bodyOf(adminLogin).user.permissions).not.toContain('admin.invite');
    });

    it('an expired invite code is rejected (401)', async () => {
      await db.prisma.adminInvite.create({
        data: {
          email: 'expirado@shamell.test',
          fullName: 'Admin Expirado',
          codeHash: sha256Hex('123456'),
          invitedById: superAdminId,
          expiresAt: new Date(Date.now() - 1_000),
        },
      });

      const res = await http().post(VERIFY).send({
        email: 'expirado@shamell.test',
        code: '123456',
        password: 'ClaveAdmin123!',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Concurrent verification of the same invite', () => {
    let superAdminId: string;

    beforeAll(async () => {
      ({ superAdminId } = await resetWorld());
    });
    afterAll(() => app.close());

    it('two simultaneous verifications create exactly one admin and never return 500', async () => {
      const email = 'carrera@shamell.test';
      await db.prisma.adminInvite.create({
        data: {
          email,
          fullName: 'Admin Carrera',
          codeHash: sha256Hex('654321'),
          invitedById: superAdminId,
          expiresAt: new Date(Date.now() + 60_000),
        },
      });

      const payload = { email, code: '654321', password: 'ClaveAdmin123!' };
      const [a, b] = await Promise.all([
        http().post(VERIFY).send(payload),
        http().post(VERIFY).send(payload),
      ]);
      const statuses = [a.status, b.status].sort();

      expect(statuses).toContain(201);
      expect(statuses).not.toContain(500);
      expect(await db.prisma.user.count({ where: { email } })).toBe(1);
    });
  });

  describe('Security headers (Helmet)', () => {
    beforeAll(resetWorld);
    afterAll(() => app.close());

    it('responds with the minimum security headers', async () => {
      const res = await http().post('/api/v1/auth/login').send({});

      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['strict-transport-security']).toBeDefined();
      expect(res.headers['x-powered-by']).toBeUndefined();
    });
  });
});
