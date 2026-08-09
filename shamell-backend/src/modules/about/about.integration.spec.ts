/**
 * Integration: About content read/upsert against a real database.
 * Run: ABOUT_INTEGRATION=1 npm test -- about.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AboutRepository } from './services/about.repository';
import { AboutService } from './services/about.service';
import { AboutMediaService } from './services/about-media.service';

const run = process.env.ABOUT_INTEGRATION === '1';

(run ? describe : describe.skip)('About module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: AboutService;
  let createdId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) throw new Error('DATABASE_URL required for ABOUT_INTEGRATION');
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new AboutRepository(prisma as never);
    const media = {
      uploadHeroMedia: jest.fn(),
      deleteHeroFromCloudinary: jest.fn().mockResolvedValue(undefined),
      warmAboutVideoCdn: jest.fn().mockResolvedValue(undefined),
      ensureCloudinaryEnv: jest.fn(),
      ensureHeroMediaFile: jest.fn(),
    } as unknown as AboutMediaService;
    service = new AboutService(repository, media);
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.aboutContent
        .delete({ where: { id: createdId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('creates then reads public about content without media upload', async () => {
    const suffix = Date.now();
    const created = await prisma.aboutContent.create({
      data: {
        title: `Integration About ${suffix}`,
        paragraph1: 'Integration paragraph',
        coreValues: ['Quality'],
        imageUrl: null,
        imagePublicId: null,
        heroMediaType: 'IMAGE',
        isActive: true,
      },
    });
    createdId = created.id;

    const publicAbout = await service.getPublicAboutContent();
    expect(publicAbout.id).toBe(created.id);
    expect(publicAbout.title).toContain('Integration About');

    const admin = await service.getAdminAboutContent();
    expect(admin?.id).toBe(created.id);
  });
});
