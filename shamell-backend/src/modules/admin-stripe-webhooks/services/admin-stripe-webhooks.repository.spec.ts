import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makePrismaWebhookEvent } from '../__mocks__/admin-stripe-webhooks.fixtures';
import { AdminStripeWebhooksRepository } from './admin-stripe-webhooks.repository';

describe('AdminStripeWebhooksRepository', () => {
  let repository: AdminStripeWebhooksRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminStripeWebhooksRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(AdminStripeWebhooksRepository);
  });

  it('countEvents and findEventsPage pass where/pagination', async () => {
    const where = { status: 'PROCESSED' as const };
    prisma.stripeWebhookEvent.count.mockResolvedValue(2);
    prisma.stripeWebhookEvent.findMany.mockResolvedValue([
      makePrismaWebhookEvent(),
    ]);

    await expect(repository.countEvents(where)).resolves.toBe(2);
    await repository.findEventsPage(where, 0, 20);

    expect(prisma.stripeWebhookEvent.count).toHaveBeenCalledWith({ where });
    expect(prisma.stripeWebhookEvent.findMany).toHaveBeenCalledWith({
      where,
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 20,
    });
  });

  it('findByStripeEventId uses eventId unique key', async () => {
    const row = makePrismaWebhookEvent();
    prisma.stripeWebhookEvent.findUnique.mockResolvedValue(row);
    await expect(repository.findByStripeEventId('evt_test_1')).resolves.toEqual(
      row,
    );
    expect(prisma.stripeWebhookEvent.findUnique).toHaveBeenCalledWith({
      where: { eventId: 'evt_test_1' },
    });
  });

  it('findRelatedPaymentSources short-circuits without session', async () => {
    await expect(repository.findRelatedPaymentSources(null)).resolves.toEqual({
      bookingPayment: null,
      classEnrollment: null,
      packageEnrollment: null,
      fixedEnrollment: null,
      venueReservation: null,
    });
    expect(prisma.bookingPayment.findUnique).not.toHaveBeenCalled();
  });

  it('findRelatedPaymentSources queries all payment models', async () => {
    prisma.bookingPayment.findUnique.mockResolvedValue(null);
    prisma.upcomingClassEnrollment.findFirst.mockResolvedValue(null);
    prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue(null);
    prisma.upcomingFixedEventEnrollment.findUnique.mockResolvedValue(null);
    prisma.venueSeatReservation.findUnique.mockResolvedValue({
      id: 'vsr-1',
    });

    const sources = await repository.findRelatedPaymentSources('  cs_test_1  ');
    expect(sources.venueReservation).toEqual({ id: 'vsr-1' });
    expect(prisma.bookingPayment.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeCheckoutSessionId: 'cs_test_1' },
      }),
    );
  });
});
