/**
 * Integration: Health readiness against a real database.
 * Run: HEALTH_INTEGRATION=1 npm test -- health.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { HEALTH_DB_CONNECTED } from './constants/health.constants';
import { HealthService } from './services/health.service';

const run = process.env.HEALTH_INTEGRATION === '1';

(run ? describe : describe.skip)('Health module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: HealthService;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for HEALTH_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();
    service = new HealthService(prisma as never);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  it('readiness returns connected when DB is reachable', async () => {
    await expect(service.readiness()).resolves.toEqual({
      ok: true,
      db: HEALTH_DB_CONNECTED,
    });
  });
});
