/**
 * Integration: Availability public rules against a real database.
 * Run: AVAILABILITY_INTEGRATION=1 npm test -- availability.integration
 */
import { ConfigService } from '@nestjs/config';
import { AvailabilityClosureKind, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AvailabilityRepository } from './services/availability.repository';
import { AvailabilityService } from './services/availability.service';

const run = process.env.AVAILABILITY_INTEGRATION === '1';

(run ? describe : describe.skip)('Availability module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: AvailabilityService;
  let createdClosureId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for AVAILABILITY_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new AvailabilityRepository(prisma as never);
    const config = {
      get: () => undefined,
    } as unknown as ConfigService;
    service = new AvailabilityService(repository, config);
  });

  afterAll(async () => {
    if (createdClosureId) {
      await prisma.availabilityClosure
        .delete({ where: { id: createdClosureId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('getPublicRules returns shaped payload and sees seeded closure', async () => {
    const suffix = Date.now();
    const dateIso = '2099-01-15';
    const created = await prisma.availabilityClosure.create({
      data: {
        kind: AvailabilityClosureKind.SPECIFIC_DATE,
        date: new Date(`${dateIso}T12:00:00.000Z`),
        note: `Integration ${suffix}`,
      },
    });
    createdClosureId = created.id;

    const rules = await service.getPublicRules();
    expect(typeof rules.timeZone).toBe('string');
    expect(Array.isArray(rules.weekly)).toBe(true);
    expect(Array.isArray(rules.closures)).toBe(true);
    expect(rules.closures.some((c) => c.date === dateIso)).toBe(true);
  });
});
