/**
 * Integration: Floor layout read against a real database.
 * Run: FLOOR_LAYOUT_INTEGRATION=1 npm test -- floor-layout.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { FloorLayoutRepository } from './services/floor-layout.repository';
import { FloorLayoutService } from './services/floor-layout.service';

const run = process.env.FLOOR_LAYOUT_INTEGRATION === '1';

(run ? describe : describe.skip)('FloorLayout module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: FloorLayoutService;
  let createdId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for FLOOR_LAYOUT_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new FloorLayoutRepository(prisma as never);
    service = new FloorLayoutService(repository);
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.venueFloorLayout
        .delete({ where: { id: createdId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('creates then reads admin layout and active id', async () => {
    const suffix = Date.now();
    const created = await prisma.venueFloorLayout.create({
      data: {
        viewBoxWidth: 614,
        viewBoxHeight: 944,
        backgroundVersion: `v-int-${suffix}`,
        items: [],
        sceneZones: {},
        isActive: true,
      },
    });
    createdId = created.id;

    const admin = await service.getAdminFloorLayout();
    expect(admin.id).toBe(created.id);
    expect(admin.isDefault).toBe(false);

    const activeId = await service.getActiveFloorLayoutId();
    expect(activeId).toBe(created.id);
  });
});
