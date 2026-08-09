/**
 * Integration: standalone chairs against a real database.
 * Run: STANDALONE_CHAIRS_INTEGRATION=1 npm test -- standalone-chairs.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { FloorLayoutService } from '../floor-layout/services/floor-layout.service';
import { StandaloneChairsRepository } from './services/standalone-chairs.repository';
import { StandaloneChairsService } from './services/standalone-chairs.service';

const run = process.env.STANDALONE_CHAIRS_INTEGRATION === '1';

(run ? describe : describe.skip)('StandaloneChairs module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: StandaloneChairsService;
  const createdChairIds: string[] = [];

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        'DATABASE_URL required for STANDALONE_CHAIRS_INTEGRATION',
      );
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new StandaloneChairsRepository(prisma as never);
    const floorLayout = {
      syncStandaloneChairUnitPricesInActiveLayout: jest
        .fn()
        .mockResolvedValue(undefined),
    } as unknown as FloorLayoutService;
    service = new StandaloneChairsService(repository, floorLayout);
  });

  afterAll(async () => {
    if (createdChairIds.length > 0) {
      await prisma.venueStandaloneChair
        .deleteMany({ where: { id: { in: createdChairIds } } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('upserts quantity, lists public, then deletes all', async () => {
    const before = await service.getPublicStandaloneChairs();
    const targetQty = Math.max(before.availableQuantity, 0) + 1;

    const admin = await service.upsertAdminStandaloneChairs({
      availableQuantity: targetQty,
      unitPrice: 12.5,
    });
    createdChairIds.push(...admin.chairs.map((c) => c.id));

    expect(admin.availableQuantity).toBe(targetQty);
    expect(admin.chairs.length).toBe(targetQty);

    const pub = await service.getPublicStandaloneChairs();
    expect(pub.availableQuantity).toBe(targetQty);

    await service.deleteAllAdminStandaloneChairs();
    createdChairIds.length = 0;

    const after = await service.getPublicStandaloneChairs();
    expect(after.availableQuantity).toBe(0);
  });
});
