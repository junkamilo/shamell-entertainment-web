import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import {
  EventPublicSection,
  UpcomingClassEnrollmentStatus,
} from '@prisma/client';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../src/common/auth/guards/admin-jwt.guard';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { createPrismaMock, type PrismaMock } from '../src/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '../src/modules/mail/services/admin-payment-notify.service';
import { ReservationEventTemplatesService } from '../src/modules/reservation-event-templates/services/reservation-event-templates.service';
import { createStripeServiceMock } from '../src/modules/stripe/__mocks__/stripe.service.mock';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import {
  makeClassEnrollmentStub,
  makeClassesEventStub,
  makeStripeCheckoutSessionLite,
  makeUpcomingClassSessionStub,
} from '../src/modules/upcoming-events/__mocks__/upcoming-events.fixtures';
import { UpcomingEventsController } from '../src/modules/upcoming-events/controllers/upcoming-events.controller';
import { AdminClassEnrollmentService } from '../src/modules/upcoming-events/services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../src/modules/upcoming-events/services/admin-fixed-event-enrollment.service';
import { UpcomingEventsRepository } from '../src/modules/upcoming-events/services/upcoming-events.repository';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import { UpcomingEventsPublicService } from '../src/modules/upcoming-events/services/upcoming-events-public.service';
import { UpcomingEventsCheckoutService } from '../src/modules/upcoming-events/services/upcoming-events-checkout.service';
import { UpcomingEventsWebhookService } from '../src/modules/upcoming-events/services/upcoming-events-webhook.service';
import { UpcomingEventsAdminSessionsService } from '../src/modules/upcoming-events/services/upcoming-events-admin-sessions.service';
import { UpcomingEventsVenueConfigService } from '../src/modules/upcoming-events/services/upcoming-events-venue-config.service';
import type {
  CheckoutSessionCreatedBody,
  ReconcileBody,
  RegenerateSessionsBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_ID = '22222222-2222-4222-8222-222222222222';
const SLUG = 'salsa-night';

const classCheckoutDto = {
  sessionId: SESSION_ID,
  customerName: 'Guest User',
  customerEmail: 'guest@example.com',
};

type DeepHttpHarness = {
  app: INestApplication<App>;
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
};

async function createDeepUpcomingEventsHttpApp(): Promise<DeepHttpHarness> {
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const adminClassEnrollment = {
    getAdminClassBookingContext: jest.fn(),
    listAdminBookableClassEvents: jest.fn(),
    createAdminClassCashEnrollment: jest.fn(),
    createAdminClassCheckoutSession: jest.fn(),
    resolveClassPayCheckoutClientSecret: jest.fn(),
  };
  const adminFixedEventEnrollment = {
    listBoxOfficeFixedEvents: jest.fn(),
    createAdminCash: jest.fn(),
    createAdminCheckoutSession: jest.fn(),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_test_created',
    client_secret: 'cs_test_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_test_created' });
  stripe.client.checkout.sessions.retrieve = jest.fn();

  const moduleRef = await Test.createTestingModule({
    controllers: [UpcomingEventsController],
    providers: [
      UpcomingEventsService,
      UpcomingEventsPublicService,
      UpcomingEventsCheckoutService,
      UpcomingEventsWebhookService,
      UpcomingEventsAdminSessionsService,
      UpcomingEventsVenueConfigService,
      UpcomingEventsRepository,
      { provide: PrismaService, useValue: prisma },
      { provide: StripeService, useValue: stripe },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      {
        provide: ReservationEventTemplatesService,
        useValue: {},
      },
      {
        provide: AdminClassEnrollmentService,
        useValue: adminClassEnrollment,
      },
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

  return { app, prisma, stripe };
}

function mockPublicClassesEvent(
  prisma: PrismaMock,
  overrides: Record<string, unknown> = {},
) {
  const event = {
    ...makeClassesEventStub({ id: EVENT_ID, slug: SLUG }),
    publicSection: EventPublicSection.UPCOMING_EVENTS,
    eventType: { name: 'Salsa Night' },
    galleryPhotos: [],
    ...overrides,
  };
  prisma.event.findFirst.mockResolvedValue(event);
  return event;
}

function mockFutureClassSession(
  eventId: string,
  overrides: Record<string, unknown> = {},
) {
  return makeUpcomingClassSessionStub({
    id: SESSION_ID,
    eventId,
    endsAt: new Date(Date.now() + 86_400_000),
    ...overrides,
  });
}

function pendingClassEnrollmentInclude(
  overrides: Record<string, unknown> = {},
) {
  return {
    ...makeClassEnrollmentStub({
      status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      amount: 50,
      currency: 'usd',
      customerEmailSentAt: null,
      stripeCheckoutSessionId: 'cs_reconcile',
    }),
    session: {
      startsAt: new Date('2026-08-15T15:00:00.000Z'),
      endsAt: new Date('2026-08-15T16:00:00.000Z'),
      timezone: 'America/New_York',
      section: null,
      event: {
        slug: SLUG,
        eventType: { name: 'Salsa Night' },
      },
    },
    ...overrides,
  };
}

describe('UpcomingEvents class flows (deep e2e)', () => {
  let harness: DeepHttpHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepUpcomingEventsHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST sessions/checkout-session returns 409 when sold out', async () => {
    const event = mockPublicClassesEvent(harness.prisma);
    const session = mockFutureClassSession(event.id, { capacity: 20 });
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(
      session.capacity,
    );

    await request(harness.app.getHttpServer())
      .post(`/api/v1/upcoming-events/${SLUG}/sessions/checkout-session`)
      .send(classCheckoutDto)
      .expect(409);
  });

  it('POST sessions/checkout-session creates PENDING enrollment and returns clientSecret', async () => {
    const event = mockPublicClassesEvent(harness.prisma);
    const session = mockFutureClassSession(event.id);
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(session);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
    harness.prisma.upcomingClassEnrollment.create.mockResolvedValue({
      id: 'enroll-new',
    });

    const res = await request(harness.app.getHttpServer())
      .post(`/api/v1/upcoming-events/${SLUG}/sessions/checkout-session`)
      .send(classCheckoutDto)
      .expect(201);

    const body = res.body as CheckoutSessionCreatedBody;
    expect(body.clientSecret).toBe('cs_test_secret');
    expect(body.enrollmentId).toBe('enroll-new');
    expect(harness.prisma.upcomingClassEnrollment.create).toHaveBeenCalled();
    const createCalls = harness.prisma.upcomingClassEnrollment.create.mock
      .calls as Array<
      [
        {
          data: {
            sessionId: string;
            status: UpcomingClassEnrollmentStatus;
            stripeCheckoutSessionId: string;
          };
        },
      ]
    >;
    expect(createCalls[0][0].data.sessionId).toBe(SESSION_ID);
    expect(createCalls[0][0].data.status).toBe(
      UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
    );
    expect(createCalls[0][0].data.stripeCheckoutSessionId).toBe(
      'cs_test_created',
    );
  });

  it('POST class-enrollments/reconcile marks paid checkout as reconciled', async () => {
    const enrollment = pendingClassEnrollmentInclude();
    harness.prisma.upcomingClassPackageEnrollment.findUnique.mockResolvedValue(
      null,
    );
    harness.prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
      enrollment,
    );
    harness.prisma.upcomingClassEnrollment.update.mockResolvedValue({
      ...enrollment,
      status: UpcomingClassEnrollmentStatus.PAID,
    });
    harness.stripe.client.checkout.sessions.retrieve.mockResolvedValue(
      makeStripeCheckoutSessionLite({ id: 'cs_reconcile' }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/class-enrollments/reconcile')
      .query({ session_id: 'cs_reconcile' })
      .expect(200);

    const body = res.body as ReconcileBody;
    expect(body.reconciled).toBe(true);
  });

  it('POST admin sessions/regenerate returns zero counts without template', async () => {
    harness.prisma.event.findFirst.mockResolvedValue({
      ...makeClassesEventStub({ id: EVENT_ID }),
      publicSection: EventPublicSection.UPCOMING_EVENTS,
      eventType: { name: 'Salsa Night' },
    });
    harness.prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: EVENT_ID,
      reservationEventTemplateId: null,
    });

    const res = await request(harness.app.getHttpServer())
      .post(
        `/api/v1/upcoming-events/admin/events/${EVENT_ID}/sessions/regenerate`,
      )
      .expect(200);

    const body = res.body as RegenerateSessionsBody;
    expect(body).toEqual({ upserted: 0, deactivated: 0 });
  });
});
