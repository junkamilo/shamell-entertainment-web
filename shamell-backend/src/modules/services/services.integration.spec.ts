/**
 * Integration: services catalog against a real database (Cloudinary mocked).
 * Run: SERVICES_INTEGRATION=1 npm test -- services.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ServicesMediaService } from './services/services-media.service';
import { ServicesRepository } from './services/services.repository';
import { ServicesService } from './services/services.service';

const run = process.env.SERVICES_INTEGRATION === '1';

(run ? describe : describe.skip)('Services module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: ServicesService;
  let createdTypeId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error('DATABASE_URL required for SERVICES_INTEGRATION');
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new ServicesRepository(prisma as never);
    const media = {
      ensureCloudinaryEnv: jest.fn(),
      uploadServiceMediaToCloudinary: jest.fn(),
      deleteImageFromCloudinaryByUrl: jest.fn().mockResolvedValue(undefined),
      extractCloudinaryPublicIdFromUrl: jest.fn(),
    } as unknown as ServicesMediaService;
    service = new ServicesService(repository, media);
  });

  afterAll(async () => {
    if (createdTypeId) {
      await prisma.serviceType
        .delete({ where: { id: createdTypeId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('creates then lists a service type without media upload', async () => {
    const suffix = Date.now();
    const created = await service.createServiceType({
      name: `Integration Type ${suffix}`,
    });
    createdTypeId = created.serviceType.id;

    expect(created.serviceType.name).toContain('Integration Type');

    const adminTypes = await service.getAdminServiceTypes();
    expect(adminTypes.some((t) => t.id === created.serviceType.id)).toBe(true);

    const deleted = await service.deleteServiceType(created.serviceType.id);
    expect(deleted.message).toContain('deleted');
    createdTypeId = null;
  });
});
