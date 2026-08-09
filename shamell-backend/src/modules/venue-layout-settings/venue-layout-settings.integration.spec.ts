/**
 * Integration: Venue layout settings upsert/read against a real database.
 * Run: VENUE_LAYOUT_SETTINGS_INTEGRATION=1 npm test -- venue-layout-settings.integration
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { VenueLayoutSettingsMediaService } from './services/venue-layout-settings-media.service';
import { VenueLayoutSettingsRepository } from './services/venue-layout-settings.repository';
import { VenueLayoutSettingsService } from './services/venue-layout-settings.service';

const run = process.env.VENUE_LAYOUT_SETTINGS_INTEGRATION === '1';

(run ? describe : describe.skip)(
  'VenueLayoutSettings module integration',
  () => {
    jest.setTimeout(60_000);

    let prisma: PrismaClient;
    let pool: Pool;
    let service: VenueLayoutSettingsService;
    let createdId: string | null = null;

    beforeAll(async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('dotenv/config');
      const url = process.env.DATABASE_URL?.trim();
      if (!url) {
        throw new Error(
          'DATABASE_URL required for VENUE_LAYOUT_SETTINGS_INTEGRATION',
        );
      }
      pool = new Pool({ connectionString: url, max: 2 });
      prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
      await prisma.$connect();

      const repository = new VenueLayoutSettingsRepository(prisma as never);
      const media = {
        ensureCloudinaryEnv: jest.fn(),
        ensurePromoImageFile: jest.fn(),
        uploadImage: jest.fn(),
        deleteImage: jest.fn().mockResolvedValue(undefined),
      } as unknown as VenueLayoutSettingsMediaService;
      service = new VenueLayoutSettingsService(repository, media);
    });

    afterAll(async () => {
      if (prisma && createdId) {
        await prisma.venueLayoutClientSettings
          .delete({ where: { id: createdId } })
          .catch(() => null);
      }
      if (prisma) await prisma.$disconnect();
      if (pool) await pool.end();
    });

    it('upserts then reads public settings without Cloudinary', async () => {
      const result = await service.upsertAdminSettings({
        clientEnabled: true,
        promoTitle: `Integration promo ${Date.now()}`,
        reservationTimezone: 'America/New_York',
      });
      createdId = result.settings.id;

      const publicSettings = await service.getPublicSettings();
      expect(publicSettings.clientEnabled).toBe(true);
      expect(publicSettings.promoTitle).toBe(result.settings.promoTitle);
    });
  },
);
