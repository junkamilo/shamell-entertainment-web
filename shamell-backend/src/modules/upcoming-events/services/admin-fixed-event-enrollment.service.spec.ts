import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import { createPrismaMock, type PrismaMock } from '../../../testing';
import { makeFixedTicketEventStub } from '../__mocks__/upcoming-events.fixtures';
import {
  createAdminFixedEventEnrollmentServiceTestModule,
  type AdminFixedEventEnrollmentServiceTestHarness,
} from '../testing/admin-fixed-event-enrollment-service.test-module';
import { AdminFixedEventEnrollmentService } from './admin-fixed-event-enrollment.service';

const ADMIN_ID = 'admin-1';
const EVENT_ID = 'fixed-event-1';

const cashDto = {
  upcomingEventId: EVENT_ID,
  customerName: 'Guest Buyer',
  customerEmail: 'guest@example.com',
  customerPhone: '555-0100',
  boxOfficeDetails: { channel: 'walk-in' },
};

describe('AdminFixedEventEnrollmentService', () => {
  let harness: AdminFixedEventEnrollmentServiceTestHarness;
  let service: AdminFixedEventEnrollmentService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    harness = await createAdminFixedEventEnrollmentServiceTestModule();
    service = harness.service;
    prisma = createPrismaMock();
    jest.clearAllMocks();
    harness.repository.asPrisma.mockReturnValue(prisma);
    harness.mail.sendTransactional.mockResolvedValue({ ok: true });
    harness.stripe.client.checkout.sessions.create = jest
      .fn()
      .mockResolvedValue({
        id: 'cs_fixed_admin',
        url: 'https://checkout.stripe.com/c/pay/cs_fixed_admin',
      });
    harness.stripe.client.checkout.sessions.update = jest
      .fn()
      .mockResolvedValue({ id: 'cs_fixed_admin' });
  });

  function mockTicketsRemaining(blockingCount: number) {
    prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(blockingCount);
  }

  function mockCashTransaction(ticketNumber = 1) {
    const paidEnrollment = {
      id: 'enroll-cash-1',
      amount: 75,
      currency: 'usd',
      customerName: cashDto.customerName,
      customerEmail: cashDto.customerEmail.toLowerCase(),
      ticketNumber,
      event: { eventType: { name: 'Gala Night' } },
    };

    const txCreate = jest.fn().mockResolvedValue({
      ...paidEnrollment,
      ticketNumber: null,
    });

    prisma.$transaction.mockImplementation(
      async (
        fn: (tx: {
          upcomingFixedEventEnrollment: {
            create: jest.Mock;
            aggregate: jest.Mock;
            update: jest.Mock;
            findUniqueOrThrow: jest.Mock;
          };
        }) => Promise<unknown>,
      ) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            create: txCreate,
            aggregate: jest.fn().mockResolvedValue({
              _max: { ticketNumber: ticketNumber - 1 },
            }),
            update: jest.fn().mockResolvedValue({
              ...paidEnrollment,
              ticketNumber,
            }),
            findUniqueOrThrow: jest.fn().mockResolvedValue(paidEnrollment),
          },
        };
        return fn(tx);
      },
    );
    prisma.upcomingFixedEventEnrollment.update.mockResolvedValue(
      paidEnrollment,
    );
    return { paidEnrollment, txCreate };
  }

  describe('createAdminCash', () => {
    it('happy path returns PAID enrollment with ticketNumber and sends confirmation', async () => {
      prisma.event.findFirst.mockResolvedValue(makeFixedTicketEventStub());
      mockTicketsRemaining(0);
      const { txCreate } = mockCashTransaction(3);

      const result = await service.createAdminCash(ADMIN_ID, cashDto);

      expect(result).toEqual({
        enrollmentId: 'enroll-cash-1',
        ticketNumber: 3,
        message: 'Ticket reserved.',
      });
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      expect(
        harness.adminPaymentNotify.notifyPaymentOutcome,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          outcome: 'PAID',
          flow: 'FIXED_TICKET',
        }),
      );
      const createCalls = txCreate.mock.calls as Array<
        [{ data: { status: UpcomingClassEnrollmentStatus } }]
      >;
      expect(createCalls[0][0].data.status).toBe(
        UpcomingClassEnrollmentStatus.PAID,
      );
    });

    it('rejects sold out with ConflictException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({
          venueConfig: { fixedTicketCapacity: 2 },
        }),
      );
      mockTicketsRemaining(2);

      await expect(
        service.createAdminCash(ADMIN_ID, cashDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects missing event with NotFoundException', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(
        service.createAdminCash(ADMIN_ID, {
          upcomingEventId: 'missing',
          customerName: 'Guest',
          customerEmail: 'g@example.com',
          boxOfficeDetails: {},
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects inactive event (findFirst null) with NotFoundException', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.createAdminCash(ADMIN_ID, cashDto)).rejects.toThrow(
        'Upcoming event not found.',
      );
    });

    it('rejects non-FIXED_EVENT schedule with BadRequestException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({
          venueConfig: {
            reservationEventTemplate: {
              scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
            },
          },
        }),
      );

      await expect(
        service.createAdminCash(ADMIN_ID, cashDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects clientEnabled venue seating with BadRequestException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({
          venueConfig: { clientEnabled: true },
        }),
      );

      await expect(service.createAdminCash(ADMIN_ID, cashDto)).rejects.toThrow(
        'This event does not offer fixed tickets.',
      );
    });

    it('rejects unset capacity with BadRequestException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({
          venueConfig: { fixedTicketCapacity: null },
        }),
      );

      await expect(service.createAdminCash(ADMIN_ID, cashDto)).rejects.toThrow(
        'Ticket capacity is not configured for this event.',
      );
    });

    it('rejects invalid price with BadRequestException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({ price: 0.1 }),
      );

      await expect(service.createAdminCash(ADMIN_ID, cashDto)).rejects.toThrow(
        'Invalid event ticket price.',
      );
    });
  });

  describe('createAdminCheckoutSession', () => {
    it('happy path returns payUrl and PENDING enrollment', async () => {
      prisma.event.findFirst.mockResolvedValue(makeFixedTicketEventStub());
      mockTicketsRemaining(1);
      prisma.upcomingFixedEventEnrollment.create.mockResolvedValue({
        id: 'enroll-checkout-1',
      });

      const result = await service.createAdminCheckoutSession(
        ADMIN_ID,
        cashDto,
      );

      expect(result).toEqual({
        enrollmentId: 'enroll-checkout-1',
        message: 'Payment link sent to customer.',
        payUrl: 'https://checkout.stripe.com/c/pay/cs_fixed_admin',
      });
      expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
      expect(harness.mail.sendTransactional).toHaveBeenCalled();
      const createCalls = prisma.upcomingFixedEventEnrollment.create.mock
        .calls as Array<[{ data: { status: UpcomingClassEnrollmentStatus } }]>;
      expect(createCalls[0][0].data.status).toBe(
        UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      );
    });

    it('rejects sold out with ConflictException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({
          venueConfig: { fixedTicketCapacity: 5 },
        }),
      );
      mockTicketsRemaining(5);

      await expect(
        service.createAdminCheckoutSession(ADMIN_ID, cashDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects missing slug with BadRequestException', async () => {
      prisma.event.findFirst.mockResolvedValue(
        makeFixedTicketEventStub({ slug: '   ' }),
      );
      mockTicketsRemaining(0);

      await expect(
        service.createAdminCheckoutSession(ADMIN_ID, cashDto),
      ).rejects.toThrow('Event slug is required for payment links.');
    });
  });

  describe('listBoxOfficeFixedEvents', () => {
    it('returns only active fixed ticket events with purchaseKind', async () => {
      const fixed = makeFixedTicketEventStub();
      prisma.event.findMany.mockResolvedValue([fixed]);
      mockTicketsRemaining(10);

      const result = await service.listBoxOfficeFixedEvents();

      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual(
        expect.objectContaining({
          id: EVENT_ID,
          name: 'Gala Night',
          slug: 'gala-night',
          purchaseKind: 'fixed_ticket',
          price: 75,
          ticketsRemaining: 40,
          fixedTicketCapacity: 50,
        }),
      );
    });

    it('skips events that cannot resolve a purchaseKind', async () => {
      prisma.event.findMany.mockResolvedValue([
        makeFixedTicketEventStub({
          experienceType: UpcomingExperienceType.CLASSES,
          venueConfig: {
            clientEnabled: true,
            reservationEventTemplate: {
              scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
            },
          },
        }),
      ]);

      const result = await service.listBoxOfficeFixedEvents();

      expect(result.events).toEqual([]);
    });
  });
});
