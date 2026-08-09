/**
 * Integration: Bookings public occupied against a real database.
 * Run: BOOKINGS_INTEGRATION=1 npm test -- bookings.integration
 */
import { ConfigService } from '@nestjs/config';
import { BookingSource, BookingStatus, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { BookingsRepository } from './services/bookings.repository';
import { BookingsAdminService } from './services/bookings-admin.service';
import type { AvailabilityService } from '../availability/services/availability.service';

const run = process.env.BOOKINGS_INTEGRATION === '1';

(run ? describe : describe.skip)('Bookings module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let admin: BookingsAdminService;
  let createdBookingId: string | null = null;
  let serviceId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for BOOKINGS_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const svc = await prisma.service.findFirst({
      where: { isActive: true },
      select: { id: true },
    });
    if (!svc) {
      throw new Error(
        'Need at least one active service for BOOKINGS_INTEGRATION',
      );
    }
    serviceId = svc.id;

    const repository = new BookingsRepository(prisma as never);
    const availability = {
      bookingTimeZone: () => 'America/New_York',
      assertDateTimeAllowed: () => Promise.resolve(undefined),
    } as unknown as AvailabilityService;
    const mail = {
      sendTransactional: () => Promise.resolve({ ok: false }),
    };
    const notify = {
      notifyCustomerActivity: () => Promise.resolve(undefined),
    };
    const paymentNotify = {
      notifyPaymentOutcome: () => Promise.resolve(undefined),
    };
    const config = { get: () => undefined } as unknown as ConfigService;

    admin = new BookingsAdminService(
      repository,
      availability,
      mail as never,
      notify as never,
      paymentNotify as never,
      config,
    );
  });

  afterAll(async () => {
    if (createdBookingId) {
      await prisma.booking
        .delete({ where: { id: createdBookingId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('getPublicOccupiedByDate sees a seeded booking window', async () => {
    const dateISO = '2099-06-15';
    const eventDate = new Date(`${dateISO}T16:00:00.000Z`);
    const created = await prisma.booking.create({
      data: {
        serviceId: serviceId!,
        eventDate,
        location: 'Integration Studio',
        status: BookingStatus.CONFIRMED,
        source: BookingSource.ADMIN_PHONE,
        guestFullName: 'Integration Guest',
        guestEmail: `integration-${Date.now()}@example.com`,
        guestPhone: '+15550001111',
        bookingDetails: {
          eventTimeStart: '12:00',
          eventTimeEnd: '14:00',
        },
      },
    });
    createdBookingId = created.id;

    const occupied = await admin.getPublicOccupiedByDate(dateISO);
    expect(occupied.date).toBe(dateISO);
    expect(
      occupied.occupied.some(
        (w) => w.startMinutes === 12 * 60 && w.endMinutes === 14 * 60,
      ),
    ).toBe(true);
  });
});
