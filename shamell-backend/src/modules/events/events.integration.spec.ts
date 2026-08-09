/**
 * Integration: Events public/admin against a real database.
 * Run: EVENTS_INTEGRATION=1 npm test -- events.integration
 */
import {
  EventPublicSection,
  EventTypeCatalogChannel,
  PrismaClient,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { EventsRepository } from './services/events.repository';
import { EventsService } from './services/events.service';
import type { GalleryService } from '../gallery/services/gallery.service';

const run = process.env.EVENTS_INTEGRATION === '1';

(run ? describe : describe.skip)('Events module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: EventsService;
  let createdEventId: string | null = null;
  let createdEventTypeId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for EVENTS_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new EventsRepository(prisma as never);
    const gallery = {
      deletePhoto: () => Promise.resolve(undefined),
      createPhotosForEvent: () => Promise.resolve([]),
    } as unknown as GalleryService;
    service = new EventsService(repository, gallery);
  });

  afterAll(async () => {
    if (createdEventId) {
      await prisma.event
        .delete({ where: { id: createdEventId } })
        .catch(() => null);
    }
    if (createdEventTypeId) {
      await prisma.eventType
        .delete({ where: { id: createdEventTypeId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('getPublicEvents / getAdminEventById see a seeded event', async () => {
    const suffix = Date.now();
    const eventType = await prisma.eventType.create({
      data: {
        name: `Integration Type ${suffix}`,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
        isActive: true,
      },
    });
    createdEventTypeId = eventType.id;

    const event = await prisma.event.create({
      data: {
        eventTypeId: eventType.id,
        description: 'Integration event',
        items: ['Item A'],
        showOnHome: true,
        isActive: true,
        publicSection: EventPublicSection.GENERAL,
      },
    });
    createdEventId = event.id;

    const publicList = await service.getPublicEvents({
      publicSection: EventPublicSection.GENERAL,
    });
    expect(publicList.some((row) => row.id === event.id)).toBe(true);

    const adminOne = await service.getAdminEventById(event.id);
    expect(adminOne.id).toBe(event.id);
    expect(adminOne.description).toBe('Integration event');
  });
});
