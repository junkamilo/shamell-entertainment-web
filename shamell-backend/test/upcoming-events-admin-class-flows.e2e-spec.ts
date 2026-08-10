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
import { REQUEST_ID_HEADER } from '../src/common/http/constants/http-headers.constants';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { createPrismaMock, type PrismaMock } from '../src/testing';
import { MailService } from '../src/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '../src/modules/mail/services/admin-payment-notify.service';
import { createStripeServiceMock } from '../src/modules/stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import { createUpcomingEventsRepositoryMock } from '../src/modules/upcoming-events/__mocks__/upcoming-events.repository.mock';
import { createUpcomingEventsServiceMock } from '../src/modules/upcoming-events/__mocks__/upcoming-events.service.mock';
import { makeUpcomingClassSessionStub } from '../src/modules/upcoming-events/__mocks__/upcoming-events.fixtures';
import { UpcomingEventsController } from '../src/modules/upcoming-events/controllers/upcoming-events.controller';
import { AdminClassEnrollmentService } from '../src/modules/upcoming-events/services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../src/modules/upcoming-events/services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from '../src/modules/upcoming-events/services/upcoming-events.repository';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import type {
  AdminCashEnrollmentBody,
  AdminCheckoutPayLinkBody,
  ClassBookingContextBody,
  ErrorBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';
import {
  currentCalendarMonthIso,
  sessionCalendarMonthIso,
} from '../src/modules/upcoming-events/utils/class-month-package.util';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const SESSION_ID_2 = '33333333-3333-4333-8333-333333333333';

const adminSessionEnrollmentDto = {
  purchaseKind: 'session' as const,
  upcomingEventId: EVENT_ID,
  sessionId: SESSION_ID,
  customerName: 'Admin Guest',
  customerEmail: 'admin-guest@example.com',
};

const adminDayBundleDto = {
  purchaseKind: 'day_bundle' as const,
  upcomingEventId: EVENT_ID,
  sessionIds: [SESSION_ID, SESSION_ID_2],
  customerName: 'Bundle Guest',
  customerEmail: 'bundle-guest@example.com',
};

type DeepHttpHarness = {
  app: INestApplication<App>;
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
};

function classesEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    slug: 'salsa-night',
    experienceType: UpcomingExperienceType.CLASSES,
    publicSection: EventPublicSection.UPCOMING_EVENTS,
    eventType: { name: 'Salsa Night' },
    ...overrides,
  };
}

function futureSession(overrides: Record<string, unknown> = {}) {
  return makeUpcomingClassSessionStub({
    id: SESSION_ID,
    eventId: EVENT_ID,
    endsAt: new Date(Date.now() + 86_400_000),
    capacity: 10,
    price: 50,
    currency: 'usd',
    section: null,
    ...overrides,
  });
}

async function createDeepAdminClassEnrollmentHttpApp(): Promise<DeepHttpHarness> {
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
    regenerateAdminClassSessions: jest.fn(),
  };
  const adminFixedEventEnrollment = {
    listBoxOfficeFixedEvents: jest.fn(),
    createAdminCash: jest.fn(),
    createAdminCheckoutSession: jest.fn(),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_admin_created',
    client_secret: 'cs_admin_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_admin_created' });
  stripe.client.checkout.sessions.retrieve = jest.fn();

  const moduleRef = await Test.createTestingModule({
    controllers: [UpcomingEventsController],
    providers: [
      AdminClassEnrollmentService,
      { provide: UpcomingEventsRepository, useValue: repository },
      { provide: UpcomingEventsService, useValue: upcomingEventsService },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      {
        provide: AdminFixedEventEnrollmentService,
        useValue: adminFixedEventEnrollment,
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
          id: 'admin-deep-e2e',
          email: 'admin-deep@e2e.test',
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

function mockCashEnrollmentCreate(
  prisma: PrismaMock,
  session: ReturnType<typeof futureSession>,
  enrollmentId: string,
) {
  const event = classesEvent();
  prisma.upcomingClassEnrollment.create.mockResolvedValue({
    id: enrollmentId,
    amount: session.price,
    currency: session.currency,
    customerName: adminSessionEnrollmentDto.customerName,
    customerEmail: adminSessionEnrollmentDto.customerEmail,
    customerEmailSentAt: new Date(),
    session: {
      ...session,
      section: null,
      event: { ...event, eventType: event.eventType },
    },
  });
}

describe('UpcomingEvents admin class flows (deep e2e)', () => {
  let harness: DeepHttpHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepAdminClassEnrollmentHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST admin class cash happy path returns 201 enrollmentId', async () => {
    const session = futureSession();
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
    mockCashEnrollmentCreate(harness.prisma, session, 'enroll-cash-deep');

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
      .send(adminSessionEnrollmentDto)
      .expect(201);

    const body = res.body as AdminCashEnrollmentBody;
    expect(body.enrollmentId).toBe('enroll-cash-deep');
    expect(body.message).toBe('Class reservation confirmed.');
    expect(harness.prisma.upcomingClassEnrollment.create).toHaveBeenCalled();
    const createCalls = harness.prisma.upcomingClassEnrollment.create.mock
      .calls as Array<[{ data: { status: UpcomingClassEnrollmentStatus } }]>;
    expect(createCalls[0][0].data.status).toBe(
      UpcomingClassEnrollmentStatus.PAID,
    );
  });

  it('POST admin class cash returns 409 when session is full', async () => {
    const session = futureSession({ capacity: 1 });
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(1);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
      .send(adminSessionEnrollmentDto)
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('This session is full.');
  });

  it('POST admin class cash returns 400 when session ended and includes x-request-id', async () => {
    const session = futureSession({
      endsAt: new Date(Date.now() - 60_000),
    });
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(session);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
      .send(adminSessionEnrollmentDto)
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('This session has already ended.');
    const requestId = res.headers[REQUEST_ID_HEADER];
    expect(typeof requestId).toBe('string');
    expect(String(requestId).length).toBeGreaterThan(0);
  });

  it('POST admin class checkout-session happy path returns 201 payUrl', async () => {
    const session = futureSession();
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
    harness.prisma.upcomingClassEnrollment.create.mockResolvedValue({
      id: 'enroll-checkout-deep',
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/checkout-session')
      .send(adminSessionEnrollmentDto)
      .expect(201);

    const body = res.body as AdminCheckoutPayLinkBody;
    expect(body.enrollmentId).toBe('enroll-checkout-deep');
    expect(body.message).toBe('Payment link sent to customer.');
    expect(body.payUrl).toContain('/pay/class?token=');
    expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
  });

  it('POST admin day_bundle cash returns 409 when one session is full', async () => {
    const session1 = futureSession({ id: SESSION_ID });
    const session2 = futureSession({
      id: SESSION_ID_2,
      startsAt: session1.startsAt,
    });
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingClassSession.findMany.mockResolvedValue([
      session1,
      session2,
    ]);
    harness.prisma.upcomingClassEnrollment.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(session2.capacity);

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
      .send(adminDayBundleDto)
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('One or more sessions are full.');
  });

  it('GET class-booking-context returns readiness no_weekdays via real service', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(
      classesEvent({ slug: 'salsa-night' }),
    );
    harness.prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: EVENT_ID,
      reservationTimezone: 'America/New_York',
      classPackageEnabled: false,
      classPackagePrice: null,
      classPackageLabel: null,
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        timezone: 'America/New_York',
        name: 'Salsa',
        weekdays: [
          { weekday: 1, isActive: false },
          { weekday: 3, isActive: false },
        ],
        classSections: [
          {
            weekday: 1,
            isActive: true,
            sortOrder: 0,
            startTime: '18:00',
            endTime: '19:00',
            label: 'Beginner',
            price: 50,
          },
        ],
        salesStartDate: null,
        salesEndDate: null,
        eventDate: null,
        eventStartTime: null,
        eventEndTime: null,
        recurringEffectiveFrom: null,
        recurringStartTime: null,
        recurringEndTime: null,
      },
    });
    harness.prisma.upcomingClassSession.findMany.mockResolvedValue([
      futureSession(),
    ]);
    harness.prisma.upcomingClassEnrollment.findMany.mockResolvedValue([]);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(0);

    const res = await request(harness.app.getHttpServer())
      .get(
        `/api/v1/upcoming-events/admin/events/${EVENT_ID}/class-booking-context`,
      )
      .expect(200);

    const body = res.body as ClassBookingContextBody;
    expect(body.event.id).toBe(EVENT_ID);
    expect(body.readiness).toBeDefined();
    expect(body.readiness?.isBookable).toBe(false);
    expect(body.readiness?.reasons).toContain('no_weekdays');
  });

  it('POST admin month_package cash returns 409 when a month session is full', async () => {
    const timezone = 'America/New_York';
    const monthIso = currentCalendarMonthIso(timezone);
    const startsAt = new Date(Date.now() + 2 * 86_400_000);
    const endsAt = new Date(startsAt.getTime() + 3_600_000);
    const sessionMonth = sessionCalendarMonthIso(startsAt, timezone);
    expect(sessionMonth).toBe(monthIso);

    const session = futureSession({
      startsAt,
      endsAt,
      timezone,
      capacity: 5,
      price: 50,
      section: null,
      weekday: startsAt.getUTCDay(),
    });

    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: EVENT_ID,
      classPackageEnabled: true,
      classPackagePrice: 120,
      classPackageLabel: 'Full month',
      reservationTimezone: timezone,
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        timezone,
        weekdays: [{ weekday: 1, isActive: true }],
      },
    });
    harness.prisma.upcomingClassSession.findMany.mockResolvedValue([session]);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(
      session.capacity,
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/cash')
      .send({
        purchaseKind: 'month_package',
        upcomingEventId: EVENT_ID,
        monthIso,
        customerName: 'Month Guest',
        customerEmail: 'month-guest@example.com',
      })
      .expect(409);

    const body = res.body as ErrorBody;
    expect(String(body.message)).toMatch(/Session on .+ is full\./);
  });

  it('POST admin day_bundle checkout-session happy path returns 201 payUrl', async () => {
    const session1 = futureSession({ id: SESSION_ID });
    const session2 = futureSession({
      id: SESSION_ID_2,
      startsAt: session1.startsAt,
      endsAt: session1.endsAt,
    });
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());
    harness.prisma.upcomingClassSession.findMany.mockResolvedValue([
      session1,
      session2,
    ]);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
    harness.prisma.upcomingClassPackageEnrollment.create.mockResolvedValue({
      id: 'pkg-checkout-deep',
    });
    harness.prisma.upcomingClassEnrollment.create
      .mockResolvedValueOnce({ id: 'enroll-a' })
      .mockResolvedValueOnce({ id: 'enroll-b' });
    harness.prisma.upcomingClassPackageEnrollmentItem.create.mockResolvedValue(
      {},
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/checkout-session')
      .send(adminDayBundleDto)
      .expect(201);

    const body = res.body as AdminCheckoutPayLinkBody;
    expect(body.enrollmentId).toBe('pkg-checkout-deep');
    expect(body.message).toBe('Payment link sent to customer.');
    expect(body.payUrl).toContain('/pay/class?token=');
    expect(harness.stripe.client.checkout.sessions.create).toHaveBeenCalled();
  });

  it('POST admin day_bundle checkout-session returns 400 when sessionIds empty', async () => {
    harness.prisma.event.findFirst.mockResolvedValue(classesEvent());

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/upcoming-events/admin/class-enrollments/checkout-session')
      .send({
        ...adminDayBundleDto,
        sessionIds: [],
      })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
  });
});
