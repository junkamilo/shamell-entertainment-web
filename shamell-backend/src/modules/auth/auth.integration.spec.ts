/**
 * Integration: Auth login against a real database.
 * Run: AUTH_INTEGRATION=1 npm test -- auth.integration
 */
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { MailService } from '../mail/services/mail.service';
import { AuthRepository } from './services/auth.repository';
import { AuthService } from './services/auth.service';
import { hashPassword } from './utils/auth-crypto.util';

const run = process.env.AUTH_INTEGRATION === '1';

(run ? describe : describe.skip)('Auth module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: AuthService;
  let createdUserId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for AUTH_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new AuthRepository(prisma as never);
    const jwt = new JwtService({
      secret: process.env.JWT_SECRET ?? 'integration-test-secret',
    });
    const config = {
      get: (key: string) => {
        if (key === 'GOOGLE_CLIENT_ID') return undefined;
        if (key === 'FRONTEND_URL') return 'http://localhost:3000';
        if (key === 'NODE_ENV') return 'test';
        return process.env[key];
      },
    } as unknown as ConfigService;
    const mail = {
      isConfigured: () => false,
      getMissingConfigMessage: () => 'Mail not configured',
    } as unknown as MailService;

    service = new AuthService(repository, jwt, config, mail);
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user
        .delete({ where: { id: createdUserId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('loginAdmin returns accessToken for a seeded staff user', async () => {
    const suffix = Date.now();
    const email = `auth-integration-${suffix}@example.com`;
    const password = 'password123';
    const created = await prisma.user.create({
      data: {
        fullName: `Integration Admin ${suffix}`,
        email,
        password: await hashPassword(password),
        role: 'ADMIN',
      },
    });
    createdUserId = created.id;

    const result = await service.loginAdmin({ email, password });
    expect(result.accessToken).toBeTruthy();
    expect(result.user).toMatchObject({
      id: created.id,
      email,
      role: 'ADMIN',
    });
    expect(result.user.permissions).toEqual(expect.any(Array));
  });
});
