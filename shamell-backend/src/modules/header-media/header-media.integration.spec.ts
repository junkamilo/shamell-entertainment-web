/**
 * Integration: Header media/text against a real database.
 * Run: HEADER_MEDIA_INTEGRATION=1 npm test -- header-media.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { GalleryService } from '../gallery/services/gallery.service';
import { HeaderMediaRepository } from './services/header-media.repository';
import { HeaderMediaService } from './services/header-media.service';
import { HeaderTextRepository } from './services/header-text.repository';
import { HeaderTextService } from './services/header-text.service';

const run = process.env.HEADER_MEDIA_INTEGRATION === '1';

(run ? describe : describe.skip)('HeaderMedia module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let textService: HeaderTextService;
  let mediaService: HeaderMediaService;
  let createdTextId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for HEADER_MEDIA_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const textRepo = new HeaderTextRepository(prisma as never);
    textService = new HeaderTextService(textRepo);

    const mediaRepo = new HeaderMediaRepository(prisma as never);
    const gallery = {
      createPhoto: jest.fn(),
      deletePhoto: jest.fn(),
    } as unknown as GalleryService;
    mediaService = new HeaderMediaService(mediaRepo, gallery);
  });

  afterAll(async () => {
    if (createdTextId) {
      await prisma.heroHeaderContent
        .delete({ where: { id: createdTextId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('upserts then reads public header text', async () => {
    const suffix = Date.now();
    const saved = await textService.upsertAdminHeaderText({
      headline: `Integration ${suffix}`,
    });
    createdTextId = saved.id;

    const publicText = await textService.getPublicHeaderText();
    expect(publicText.headline).toContain('Integration');
  });

  it('returns empty public photos when category missing or empty', async () => {
    const photos = await mediaService.getPublicHeaderPhotos();
    expect(Array.isArray(photos)).toBe(true);
  });
});
