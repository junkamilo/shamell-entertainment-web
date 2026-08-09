/**
 * Integration: Gallery categories/photos against a real database.
 * Run: GALLERY_INTEGRATION=1 npm test -- gallery.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { GalleryMediaService } from './services/gallery-media.service';
import { GalleryRepository } from './services/gallery.repository';
import { GalleryService } from './services/gallery.service';

const run = process.env.GALLERY_INTEGRATION === '1';

(run ? describe : describe.skip)('Gallery module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: GalleryService;
  let createdCategoryId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for GALLERY_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new GalleryRepository(prisma as never);
    const media = {
      ensureCloudinaryEnv: jest.fn(),
      ensureMediaFile: jest.fn(),
      prepareMulterFileForCloudinary: jest.fn(),
      uploadMediaToCloudinary: jest.fn(),
      deleteMediaFromCloudinary: jest.fn().mockResolvedValue(undefined),
    } as unknown as GalleryMediaService;
    service = new GalleryService(repository, media);
  });

  afterAll(async () => {
    if (createdCategoryId) {
      await prisma.galleryCategory
        .delete({ where: { id: createdCategoryId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('creates then lists admin and public categories', async () => {
    const suffix = Date.now();
    const slug = `gallery-int-${suffix}`;
    const created = await prisma.galleryCategory.create({
      data: {
        name: `Integration Gallery ${suffix}`,
        slug,
        isActive: true,
      },
    });
    createdCategoryId = created.id;

    const admin = await service.getAdminCategories();
    expect(admin.some((c) => c.id === created.id)).toBe(true);

    const publicCategories = await service.getPublicCategories();
    expect(publicCategories.some((c) => c.slug === slug)).toBe(true);
  });
});
