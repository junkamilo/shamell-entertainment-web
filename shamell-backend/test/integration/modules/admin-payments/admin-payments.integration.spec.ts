/**
 * Integration: Admin payments list/badge against a real database.
 * Run: ADMIN_PAYMENTS_INTEGRATION=1 npm test -- admin-payments.integration
 */
import {
  PrismaClient,
  BookingPaymentStatus,
  BookingPaymentStage,
  BookingQuotePaymentModel,
  BookingSource,
  BookingStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AdminPaymentsRepository } from '@app/modules/admin-payments/services/admin-payments.repository';
import { AdminPaymentsService } from '@app/modules/admin-payments/services/admin-payments.service';
import type { FloorLayoutService } from '@app/modules/floor-layout/services/floor-layout.service';

const run = process.env.ADMIN_PAYMENTS_INTEGRATION === '1';

(run ? describe : describe.skip)('AdminPayments module integration', () => {
  jest.setTimeout(60_000);

  let prisma: PrismaClient;
  let pool: Pool;
  let service: AdminPaymentsService;
  let createdPaymentId: string | null = null;
  let createdBookingId: string | null = null;

  beforeAll(async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('dotenv/config');
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL required for ADMIN_PAYMENTS_INTEGRATION');
    }
    pool = new Pool({ connectionString: url, max: 2 });
    prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
    await prisma.$connect();

    const repository = new AdminPaymentsRepository(prisma as never);
    const floorLayout = {
      getActiveFloorLayoutId: jest.fn().mockResolvedValue(null),
    } as unknown as FloorLayoutService;
    service = new AdminPaymentsService(
      repository,
      prisma as never,
      floorLayout,
    );
  });

  afterAll(async () => {
    if (createdPaymentId) {
      await prisma.bookingPayment
        .delete({ where: { id: createdPaymentId } })
        .catch(() => null);
    }
    if (createdBookingId) {
      await prisma.booking
        .delete({ where: { id: createdBookingId } })
        .catch(() => null);
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it('listPayments and countBadgeSince see a seeded PAID booking payment', async () => {
    const catalogService = await prisma.service.findFirst();
    if (!catalogService) {
      throw new Error(
        'At least one Service row is required for ADMIN_PAYMENTS_INTEGRATION',
      );
    }

    const suffix = Date.now();
    const booking = await prisma.booking.create({
      data: {
        serviceId: catalogService.id,
        guestFullName: `Integration Guest ${suffix}`,
        guestEmail: `integration-${suffix}@example.com`,
        guestPhone: '+15550001111',
        eventDate: new Date(),
        location: 'Integration Venue',
        status: BookingStatus.CONFIRMED,
        source: BookingSource.ADMIN_PHONE,
      },
    });
    createdBookingId = booking.id;

    const quote = await prisma.bookingQuote.create({
      data: {
        bookingId: booking.id,
        paymentModel: BookingQuotePaymentModel.DEPOSIT,
        totalAmount: 198,
        depositAmount: 99,
        tokenHash: `integration-quote-${suffix}`,
        tokenExpiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const payment = await prisma.bookingPayment.create({
      data: {
        bookingId: booking.id,
        quoteId: quote.id,
        stage: BookingPaymentStage.DEPOSIT,
        status: BookingPaymentStatus.PAID,
        expectedAmount: 99,
        currency: 'usd',
        stripeCheckoutSessionId: `cs_integration_${suffix}`,
        paidAt: new Date(),
      },
    });
    createdPaymentId = payment.id;

    const listed = await service.listPayments({
      page: 1,
      limit: 50,
      flow: 'BOOKING_QUOTE',
      q: `integration-${suffix}@example.com`,
    });
    expect(listed.items.some((row) => row.id === payment.id)).toBe(true);

    const badge = await service.countBadgeSince(Date.now() - 60_000);
    expect(badge.count).toBeGreaterThanOrEqual(1);
  });
});
