/**
 * Integration: Admin payments list/badge against a real database.
 * Run: ADMIN_PAYMENTS_INTEGRATION=1 npm test -- admin-payments.integration
 */
import {
  PrismaClient,
  BookingPaymentStatus,
  BookingPaymentStage,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { AdminPaymentsRepository } from './services/admin-payments.repository';
import { AdminPaymentsService } from './services/admin-payments.service';
import type { FloorLayoutService } from '../floor-layout/services/floor-layout.service';

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
        status: 'QUOTE_SENT',
        source: 'ADMIN_CREATED',
      },
    });
    createdBookingId = booking.id;

    const payment = await prisma.bookingPayment.create({
      data: {
        bookingId: booking.id,
        stage: BookingPaymentStage.DEPOSIT,
        status: BookingPaymentStatus.PAID,
        expectedAmount: 99,
        currency: 'usd',
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
