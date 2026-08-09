/**
 * Integration: venue tables against a real database.
 * Run: VENUE_TABLES_INTEGRATION=1 npm test -- venue-tables.integration
 */
import { PrismaClient, VenueTableSize } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { FloorLayoutService } from '../floor-layout/services/floor-layout.service';
import { VenueTablesRepository } from './services/venue-tables.repository';
import { VenueTablesService } from './services/venue-tables.service';

const run = process.env.VENUE_TABLES_INTEGRATION === '1';

(run ? describe : describe.skip)('VenueTables module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: VenueTablesService;
  let createdId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for VENUE_TABLES_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new VenueTablesRepository(prisma as never);
    const floorLayout = {
      isTablePlacedOnLayout: jest.fn().mockResolvedValue(false),
    } as unknown as FloorLayoutService;
    service = new VenueTablesService(repository, floorLayout);
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.venueTableConfig
        .delete({ where: { id: createdId } })
        .catch(() => null);
    }
    if (prisma) await prisma.$disconnect();
    if (pool) await pool.end();
  });

  it('creates then lists public and admin tables', async () => {
    const created = await service.createAdminVenueTable({
      size: VenueTableSize.MEDIUM,
      includedChairs: 4,
      bundlePrice: 88.5,
    });
    createdId = created.id;

    expect(created.size).toBe(VenueTableSize.MEDIUM);
    expect(created.bundlePrice).toBe(88.5);

    const admin = await service.getAdminVenueTables();
    expect(admin.some((t) => t.id === created.id)).toBe(true);

    const pub = await service.getPublicVenueTables();
    expect(pub.some((t) => t.id === created.id)).toBe(true);
  });
});
