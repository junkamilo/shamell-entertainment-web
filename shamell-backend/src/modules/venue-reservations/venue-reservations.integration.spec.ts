/**
 * Integration: venue seat availability against a real database.
 * Run: VENUE_RESERVATIONS_INTEGRATION=1 npm test -- venue-reservations.integration --runInBand
 */
import {
  PrismaClient,
  VenueSeatKind,
  VenueSeatReservationStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { VenueReservationsRepository } from './services/venue-reservations.repository';
import { VenueReservationsService } from './services/venue-reservations.service';

const run = process.env.VENUE_RESERVATIONS_INTEGRATION === '1';

(run ? describe : describe.skip)('VenueReservations module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: VenueReservationsService;
  let eventId: string;
  let eventTypeId: string;
  let reservationId: string | null = null;
  const layoutItemId = `integration-item-${Date.now()}`;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error(
        'DATABASE_URL required for VENUE_RESERVATIONS_INTEGRATION',
      );
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const suffix = Date.now();
    const eventType = await prisma.eventType.create({
      data: {
        name: `vr-integration-et-${suffix}`,
        catalogChannel: 'UPCOMING_HUB',
      },
    });
    eventTypeId = eventType.id;

    const opensAt = new Date(Date.now() - 86_400_000);
    const closesAt = new Date(Date.now() + 86_400_000 * 30);
    const eventDate = new Date(Date.now() + 86_400_000 * 14);

    const event = await prisma.event.create({
      data: {
        eventTypeId: eventType.id,
        description: 'venue reservations integration',
        items: [],
        publicSection: 'UPCOMING_EVENTS',
        experienceType: 'VENUE_SEATING',
        slug: `vr-integration-${suffix}`,
        isActive: true,
      },
    });
    eventId = event.id;

    await prisma.upcomingVenueConfig.create({
      data: {
        eventId,
        clientEnabled: true,
        reservationOpensAt: opensAt,
        reservationClosesAt: closesAt,
        reservationEventDate: eventDate,
        reservationTimezone: 'America/New_York',
        reservationEventLabel: 'Integration Gala',
      },
    });

    const repository = new VenueReservationsRepository(prisma as never);
    service = new VenueReservationsService(
      repository,
      { get: () => undefined } as unknown as ConfigService,
      { sendTransactional: jest.fn() } as never,
      { notifyPaymentOutcome: jest.fn() } as never,
      {
        client: {},
        webhookSecret: 'whsec_test',
        frontendUrl: () => 'https://example.com',
      } as never,
      {
        getPublicFloorLayoutForClient: jest.fn().mockResolvedValue({
          items: [
            {
              id: layoutItemId,
              kind: 'catalog_table',
              venueTableConfigId: null,
            },
          ],
        }),
        getActiveFloorLayoutId: jest.fn().mockResolvedValue(null),
      } as never,
    );
  });

  afterAll(async () => {
    if (!prisma) return;
    if (reservationId) {
      await prisma.venueSeatReservation.deleteMany({
        where: { id: reservationId },
      });
    }
    await prisma.venueSeatReservation.deleteMany({
      where: { upcomingEventId: eventId },
    });
    await prisma.upcomingVenueConfig.deleteMany({ where: { eventId } });
    await prisma.event.deleteMany({ where: { id: eventId } });
    await prisma.eventType.deleteMany({ where: { id: eventTypeId } });
    await prisma.$disconnect();
    await pool.end();
  });

  it('getAvailability returns a shaped payload', async () => {
    const result = await service.getAvailability({
      upcomingEventId: eventId,
    });
    expect(Array.isArray(result.reservedLayoutItemIds)).toBe(true);
    expect(typeof result.reservationsOpen).toBe('boolean');
    expect(result.upcomingEventId).toBe(eventId);
  });

  it('getAvailability includes paid reservation layoutItemId', async () => {
    const eventDate = new Date(Date.now() + 86_400_000 * 14);
    const created = await prisma.venueSeatReservation.create({
      data: {
        upcomingEventId: eventId,
        kind: VenueSeatKind.CATALOG_TABLE,
        layoutItemId,
        eventDate,
        amount: 50,
        currency: 'usd',
        status: VenueSeatReservationStatus.PAID,
        customerName: 'Integration Guest',
        customerEmail: 'integration-vr@example.com',
        paidAt: new Date(),
      },
    });
    reservationId = created.id;

    const result = await service.getAvailability({
      upcomingEventId: eventId,
    });

    expect(result.reservedLayoutItemIds).toContain(layoutItemId);
    expect(
      result.paidSeatHolders.some((h) => h.layoutItemId === layoutItemId),
    ).toBe(true);
  });
});
