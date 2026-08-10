/**
 * Integration: Bookings public occupied + slot conflict + quote total against a real database.
 * Run: BOOKINGS_INTEGRATION=1 npm test -- bookings.integration --runInBand
 */
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BookingQuotePaymentModel,
  BookingSource,
  BookingStatus,
  PrismaClient,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { BookingsRepository } from './services/bookings.repository';
import { BookingsAdminService } from './services/bookings-admin.service';
import { BookingsQuoteService } from './services/bookings-quote.service';
import type { AvailabilityService } from '../availability/services/availability.service';
import type { StripeService } from '../stripe/services/stripe.service';

const run = process.env.BOOKINGS_INTEGRATION === '1';

(run ? describe : describe.skip)('Bookings module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let admin: BookingsAdminService;
  let quote: BookingsQuoteService;
  const createdBookingIds: string[] = [];
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

    const stripe = {
      frontendUrl: () => 'https://example.com',
      client: {
        checkout: {
          sessions: {
            create: () =>
              Promise.resolve({
                id: `cs_integration_${Date.now()}`,
                client_secret: 'cs_integration_secret',
              }),
            retrieve: () => Promise.resolve({ status: 'open' }),
          },
        },
      },
    } as unknown as StripeService;

    const webhook = {
      markBookingPaymentPaid: () => Promise.resolve(undefined),
      parseStripeCheckoutSession: (x: unknown) => x,
    };

    quote = new BookingsQuoteService(
      repository,
      mail as never,
      notify as never,
      config,
      stripe,
      admin,
      webhook as never,
    );
  });

  afterAll(async () => {
    for (const id of createdBookingIds) {
      await prisma.booking.delete({ where: { id } }).catch(() => null);
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
    createdBookingIds.push(created.id);

    const occupied = await admin.getPublicOccupiedByDate(dateISO);
    expect(occupied.date).toBe(dateISO);
    expect(
      occupied.occupied.some(
        (w) => w.startMinutes === 12 * 60 && w.endMinutes === 14 * 60,
      ),
    ).toBe(true);
  });

  it('createAdminBooking rejects overlapping slot on same day', async () => {
    const dateISO = '2099-07-20';
    const eventDate = new Date(`${dateISO}T16:00:00.000Z`);
    const first = await admin.createAdminBooking('integration-admin', {
      serviceId: serviceId!,
      eventDate: eventDate.toISOString(),
      location: 'Overlap Studio',
      guestFullName: 'First Guest',
      guestEmail: `overlap-first-${Date.now()}@example.com`,
      guestPhone: '+15550002222',
      bookingDetails: {
        eventTimeStart: '10:00',
        eventTimeEnd: '12:00',
      },
    });
    createdBookingIds.push(first.id);

    await expect(
      admin.createAdminBooking('integration-admin', {
        serviceId: serviceId!,
        eventDate: eventDate.toISOString(),
        location: 'Overlap Studio',
        guestFullName: 'Second Guest',
        guestEmail: `overlap-second-${Date.now()}@example.com`,
        guestPhone: '+15550003333',
        bookingDetails: {
          eventTimeStart: '11:00',
          eventTimeEnd: '13:00',
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createBookingQuote FULL writes quoteTotalAmount in DB', async () => {
    const dateISO = '2099-08-10';
    const eventDate = new Date(`${dateISO}T16:00:00.000Z`);
    const created = await admin.createAdminBooking('integration-admin', {
      serviceId: serviceId!,
      eventDate: eventDate.toISOString(),
      location: 'Quote Studio',
      guestFullName: 'Quote Guest',
      guestEmail: `quote-${Date.now()}@example.com`,
      guestPhone: '+15550004444',
    });
    createdBookingIds.push(created.id);

    const result = await quote.createBookingQuote(
      'integration-admin',
      created.id,
      {
        paymentModel: BookingQuotePaymentModel.FULL,
        totalAmount: 625,
      },
    );

    expect(result.quoteId).toBeTruthy();
    expect(result.paymentId).toBeTruthy();

    const refreshed = await prisma.booking.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(Number(refreshed.quoteTotalAmount)).toBe(625);
    expect(refreshed.quoteModel).toBe(BookingQuotePaymentModel.FULL);
  });
});
