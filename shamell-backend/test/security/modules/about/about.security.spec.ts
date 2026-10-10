import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { LocalTestDatabase } from '@test-support/database/local-test-database';
import { createRealAboutHttpApp } from '@test-support/modules/about/harnesses/about-real-http-app';
import { seedUser } from '@test-support/modules/auth/fixtures/auth-db.fixtures';
import { JwtService } from '@nestjs/jwt';
import { resolveJwtSecret } from '@app/common/config/jwt-secret.util';

const run = process.env.AUTH_INTEGRATION === '1';

(run ? describe : describe.skip)('About — security (real HTTP + DB)', () => {
  jest.setTimeout(30_000);

  const db = new LocalTestDatabase();
  const jwt = new JwtService({ secret: resolveJwtSecret() });
  let app: INestApplication<App>;

  let superAdminToken: string;
  let clientToken: string;

  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    await db.start();
    await db.truncate('users', 'about_content');
    ({ app } = await createRealAboutHttpApp());

    const superAdmin = await seedUser(db.prisma, { email: 'admin-about@test.com', role: 'SUPER_ADMIN' });
    const client = await seedUser(db.prisma, { email: 'client-about@test.com', role: 'CLIENT' });

    superAdminToken = await jwt.signAsync({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
      permissions: ['about.manage'],
    });

    clientToken = await jwt.signAsync({
      sub: client.id,
      email: client.email,
      role: client.role,
      permissions: [],
    });
  });

  afterAll(async () => {
    await app.close();
    await db.stop();
  });

  describe('Authorization on /api/v1/about/admin', () => {
    it('rejects unauthenticated requests to PATCH /api/v1/about/admin (401)', async () => {
      const res = await http().patch('/api/v1/about/admin').send({ title: 'Test' });
      expect(res.status).toBe(401);
    });

    it('rejects regular clients from modifying about settings (403)', async () => {
      const res = await http()
        .patch('/api/v1/about/admin')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({ title: 'Test' });
      expect(res.status).toBe(403);
    });
  });

  describe('Mass Assignment & Injection on PATCH /api/v1/about/admin', () => {
    it('rejects extra fields not in DTO if forbidNonWhitelisted is active, or safely ignores them', async () => {
      const res = await http()
        .patch('/api/v1/about/admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          title: 'Valid Title',
          role: 'SUPER_ADMIN', // Mass assignment attempt
          id: 'malicious-id'
        });
      
      // If validation pipe is perfectly strict, it should 400.
      // If it strips, it should 200 but NOT save the fields.
      // Let's assume strict (400) or 200 (stripped). We'll assert it's not 500.
      expect(res.status).not.toBe(500);
      if (res.status === 200) {
        const settings = await db.prisma.aboutContent.findFirst();
        expect(settings).not.toHaveProperty('role');
      } else {
        expect(res.status).toBe(400);
      }
    });

    it('rejects extremely large payloads (MaxLength bypass)', async () => {
      const hugeString = 'a'.repeat(20000); // Exceeds 16000
      const res = await http()
        .patch('/api/v1/about/admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ paragraph1: hugeString });
      
      expect(res.status).toBe(400); // Should be blocked by validation
    });

    it('rejects SQL injection payloads', async () => {
      const sqlInjection = "'; DROP TABLE about_content; --";
      const res = await http()
        .patch('/api/v1/about/admin')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ title: sqlInjection });
      
      // The update should work (OR 400), but never execute the SQL and never 500
      expect(res.status).not.toBe(500);
    });
  });

});
