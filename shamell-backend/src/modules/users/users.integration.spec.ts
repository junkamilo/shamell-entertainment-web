/**
 * Integration: UsersService.register against a real database.
 * Run: USERS_INTEGRATION=1 npm test -- users.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { UsersRepository } from './services/users.repository';
import { UsersService } from './services/users.service';

const run = process.env.USERS_INTEGRATION === '1';

(run ? describe : describe.skip)('Users module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: UsersService;
  let createdUserId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for USERS_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();
    service = new UsersService(new UsersRepository(prisma as never));
  });

  afterAll(async () => {
    if (prisma && createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
  });

  it('registers a new user', async () => {
    const suffix = Date.now();
    const email = `users-integration-${suffix}@example.com`;
    const result = await service.register({
      fullName: 'Integration User',
      email,
      password: 'password123',
      phone: null as unknown as undefined,
    });

    createdUserId = result.user.id;
    expect(result.message).toBe('User registered successfully');
    expect(result.user.email).toBe(email);
    expect(result.user.fullName).toBe('Integration User');
  });
});
