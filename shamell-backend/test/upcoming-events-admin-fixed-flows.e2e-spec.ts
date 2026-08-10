import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import {
  EventPublicSection,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { createPrismaMock, type PrismaMock } from '../src/testing';
import { MailService } from '../src/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '../src/modules/mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../src/modules/stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '../src/modules/upcoming-events/__mocks__/upcoming-events.repository.mock';
import { createUpcomingEventsServiceMock } from '../src/modules/upcoming-events/__mocks__/upcoming-events.service.mock';
import { makeFixedTicketEventStub } from '../src/modules/upcoming-events/__mocks__/upcoming-events.fixtures';
import { UpcomingEventsController } from '../src/modules/upcoming-events/controllers/upcoming-events.controller';
import { AdminClassEnrollmentService } from '../src/modules/upcoming-events/services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../src/modules/upcoming-events/services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from '../src/modules/upcoming-events/services/upcoming-events.repository';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import type {
  AdminFixedCashBody,
  AdminFixedCheckoutBody,
  BoxOfficeFixedEventsBody,
  ErrorBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';

const adminFixedEnrollmentDto = {
  upcomingEventId: EVENT_ID,
  customerName: 'Box Office Guest',
  customerEmail: 'box-office@example.com',
  boxOfficeDetails: { channel: 'walk-in' },
};

type DeepHttpHarness = {
  app: INestApplication<App>;
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
};

function fixedEvent(overrides: Record<string, unknown> = {}) {
  return makeFixedTicketEventStub({
    id: EVENT_ID,
    slug: 'gala-night',
    publicSection: EventPublicSection.UPCOMING_EVENTS,
    experienceType: UpcomingExperienceType.VENUE_SEATING,
    ...overrides,
  });
}

async function createDeepAdminFixedEnrollmentHttpApp(): Promise<DeepHttpHarness> {
  const repository = createUpcomingEventsRepositoryMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const upcomingEventsService = {
    ...createUpcomingEventsServiceMock(),
  };
  const adminClassEnrollment = {
    listAdminBookableClassEvents: jest.fn(),
    createAdminClassCashEnrollment: jest.fn(),
    createAdminClassCheckoutSession: jest.fn(),
    getAdminClassBookingContext: jest.fn(),
    resolveClassPayCheckoutClientSecret: jest.fn(),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_fixed_deep',
    url: 'https://checkout.stripe.com/c/pay/cs_fixed_deep',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_fixed_deep' });

  const moduleRef = await Test.createTestingModule({
    controllers: [UpcomingEventsController],
    providers: [
      AdminFixedEventEnrollmentService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: UpcomingEventsService, useValue: upcomingEventsService },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      {
        provide: AdminClassEnrollmentService,
        useValue: adminClassEnrollment,
      },
    ],
  })
    .overrideGuard(AdminJwtGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => { adminUser?: { id: string; email: string } };
        };
      }) => {
        const req = context.switchToHttp().getRequest();
        req.adminUser = {
          id: 'admin-fixed-deep-e2e',
          email: 'admin-fixed-deep@e2e.test',
        };
        return true;
      },
    })
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app =
    moduleRef.createNestApplication() as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();

  const prisma = createPrismaMock();
  repository.asPrisma.mockReturnValue(prisma);

  return { app, prisma, stripe };
}

function mockCashTransaction(prisma: PrismaMock, ticketNumber = 1) {
  const paidEnrollment = {
    id: 'enroll-fixed-cash-deep',
    amount: 75,
    currency: 'usd',
    customerName: adminFixedEnrollmentDto.customerName,
    customerEmail: adminFixedEnrollmentDto.customerEmail,
    ticketNumber,
    event: { eventType: { name: 'Gala Night' } },
  };

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
          create: jest.fn().mockResolvedValue({
            ...paidEnrollment,
            ticketNumber: null,
          }),
          aggregate: jest.fn().mockResolvedValue({
            _max: { ticketNumber: ticketNumber - 1 },
          }),
          update: jest.fn().mockResolvedValue(paidEnrollment),
          findUniqueOrThrow: jest.fn().mockResolvedValue(paidEnrollment),
        },
      };
      return fn(tx);
    },
  );
  prisma.upcomingFixedEventEnrollment.update.mockResolvedValue(paidEnrollment);
}

describe('UpcomingEvents admin fixed flows (deep e2e)', () => {
  let harness: DeepHttpHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepAdminFixedEnrollmentHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST admin fixed cash happy path returns 201 with ticketNumber', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(fixedEvent());
    harness.prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(0);
    mockCashTransaction(harness.prisma, 4);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
      .send(adminFixedEnrollmentDto)
      .expect(201);

    const body = res.body as AdminFixedCashBody;
    expect(body.enrollmentId).toBe('enroll-fixed-cash-deep');
    expect(body.ticketNumber).toBe(4);
    expect(body.message).toBe('Ticket reserved.');
  });

  it('POST admin fixed checkout-session happy path returns 201 payUrl', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(fixedEvent());
    harness.prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(0);
    harness.prisma.upcomingFixedEventEnrollment.create.mockResolvedValue({
      id: 'enroll-fixed-checkout-deep',
    });

    const res = await request(harness.app.getHttpServer())
      .post(
        '/api/v1/upcoming-events/admin/fixed-event-enrollments/checkout-session',
      )
      .send(adminFixedEnrollmentDto)
      .expect(201);

    const body = res.body as AdminFixedCheckoutBody;
    expect(body.enrollmentId).toBe('enroll-fixed-checkout-deep');
    expect(body.payUrl).toBe('https://checkout.stripe.com/c/pay/cs_fixed_deep');
    expect(body.message).toBe('Payment link sent to customer.');
    expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
    const createCalls = harness.prisma.upcomingFixedEventEnrollment.create.mock
      .calls as Array<[{ data: { status: UpcomingClassEnrollmentStatus } }]>;
    expect(createCalls[0][0].data.status).toBe(
      UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
    );
  });

  it('POST admin fixed cash returns 409 when sold out', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(
      fixedEvent({
        venueConfig: { fixedTicketCapacity: 2 },
      }),
    );
    harness.prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(2);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
      .send(adminFixedEnrollmentDto)
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('Tickets sold out.');
  });

  it('POST admin fixed cash returns 404 when event inactive/missing', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(null);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
      .send(adminFixedEnrollmentDto)
      .expect(404);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('Upcoming event not found.');
  });

  it('GET box-office/fixed-events returns 200 typed list', async () => {
    harness.prisma.event.findMany.mockResolvedValue([fixedEvent()]);
    harness.prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(5);

    const res = await request(harness.app.getHttpServer())
      .get('/api/v1/upcoming-events/admin/box-office/fixed-events')
      .expect(200);

    const body = res.body as BoxOfficeFixedEventsBody;
    expect(body.events).toHaveLength(1);
    expect(body.events[0]).toEqual(
      expect.objectContaining({
        id: EVENT_ID,
        purchaseKind: 'fixed_ticket',
        ticketsRemaining: 45,
        fixedTicketCapacity: 50,
      }),
    );
  });

  it('POST admin fixed cash returns 400 when not FIXED_EVENT', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(
      fixedEvent({
        venueConfig: {
          reservationEventTemplate: {
            scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
          },
        },
      }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/fixed-event-enrollments/cash')
      .send(adminFixedEnrollmentDto)
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('This event does not offer fixed tickets.');
  });
});
