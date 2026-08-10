import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import {
  EventPublicSection,
  ReservationEventScheduleMode,
  UpcomingExperienceType,
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
  makeCheckoutClassSessionStub,
  makeClassesEventStub,
  makeFixedPublicCheckoutVenueStub,
  makeFixedTicketEventStub,
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
  ErrorBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';

const EVENT_ID = '11111111-1111-4111-8111-111111111111';
const SESSION_A = '22222222-2222-4222-8222-222222222222';
const SESSION_B = '33333333-3333-4333-8333-333333333333';
const FIXED_EVENT_ID = '44444444-4444-4444-8444-444444444444';
const SLUG = 'salsa-night';
const FIXED_SLUG = 'gala-night';

type DeepCheckoutHarness = {
  app: INestApplication<App>;
  prisma: PrismaMock;
  stripe: ReturnType<typeof createStripeServiceMock>;
};

async function createDeepCheckoutHttpApp(): Promise<DeepCheckoutHarness> {
  const prisma = createPrismaMock();
  const stripe = createStripeServiceMock();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };

  stripe.client.checkout.sessions.create = jest.fn().mockResolvedValue({
    id: 'cs_test_created',
    client_secret: 'cs_test_secret',
  });
  stripe.client.checkout.sessions.update = jest
    .fn()
    .mockResolvedValue({ id: 'cs_test_created' });

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
      { provide: ReservationEventTemplatesService, useValue: {} },
      {
        provide: AdminClassEnrollmentService,
        useValue: {
          getAdminClassBookingContext: jest.fn(),
          listAdminBookableClassEvents: jest.fn(),
          createAdminClassCashEnrollment: jest.fn(),
          createAdminClassCheckoutSession: jest.fn(),
          resolveClassPayCheckoutClientSecret: jest.fn(),
        },
      },
      {
        provide: AdminFixedEventEnrollmentService,
        useValue: {
          listBoxOfficeFixedEvents: jest.fn(),
          createAdminCash: jest.fn(),
          createAdminCheckoutSession: jest.fn(),
        },
      },
    ],
  })
    .overrideGuard(AdminJwtGuard)
    .useValue({ canActivate: () => true })
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

function mockPublicClassesEvent(prisma: PrismaMock) {
  const event = {
    ...makeClassesEventStub({ id: EVENT_ID, slug: SLUG }),
    publicSection: EventPublicSection.UPCOMING_EVENTS,
    experienceType: UpcomingExperienceType.CLASSES,
    eventType: { name: 'Salsa Night' },
    galleryPhotos: [],
  };
  prisma.event.findFirst.mockResolvedValue(event);
  return event;
}

describe('Upcoming events checkout flows (deep e2e)', () => {
  let harness: DeepCheckoutHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepCheckoutHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST sessions/checkout-session returns typed 201', async () => {
    mockPublicClassesEvent(harness.prisma);
    harness.prisma.upcomingClassSession.findFirst.mockResolvedValue(
      makeCheckoutClassSessionStub({
        id: SESSION_A,
        eventId: EVENT_ID,
      }),
    );
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(0);
    harness.prisma.upcomingClassEnrollment.create.mockResolvedValue({
      id: 'enroll-new',
    });

    const res = await request(harness.app.getHttpServer())
      .post(`/api/v1/upcoming-events/${SLUG}/sessions/checkout-session`)
      .send({
        sessionId: SESSION_A,
        customerName: 'Guest User',
        customerEmail: 'guest@example.com',
      })
      .expect(201);

    const body = res.body as CheckoutSessionCreatedBody;
    expect(body.clientSecret).toBe('cs_test_secret');
    expect(body.enrollmentId).toBe('enroll-new');
  });

  it('POST sessions/bundle-checkout-session returns 409 when sold out', async () => {
    mockPublicClassesEvent(harness.prisma);
    const startsAt = new Date(Date.now() + 86_400_000);
    const endsAt = new Date(Date.now() + 90_000_000);
    harness.prisma.upcomingClassSession.findMany.mockResolvedValue([
      makeCheckoutClassSessionStub({
        id: SESSION_A,
        eventId: EVENT_ID,
        startsAt,
        endsAt,
        capacity: 5,
      }),
      makeCheckoutClassSessionStub({
        id: SESSION_B,
        eventId: EVENT_ID,
        startsAt: new Date(startsAt.getTime() + 3_600_000),
        endsAt: new Date(endsAt.getTime() + 3_600_000),
        capacity: 5,
      }),
    ]);
    harness.prisma.upcomingClassEnrollment.count.mockResolvedValue(5);

    const res = await request(harness.app.getHttpServer())
      .post(`/api/v1/upcoming-events/${SLUG}/sessions/bundle-checkout-session`)
      .send({
        sessionIds: [SESSION_A, SESSION_B],
        customerName: 'Guest User',
        customerEmail: 'guest@example.com',
      })
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(409);
  });

  it('POST class-package/checkout-session returns typed 400 when disabled', async () => {
    mockPublicClassesEvent(harness.prisma);
    harness.prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: EVENT_ID,
      classPackageEnabled: false,
      classPackagePrice: 120,
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
        timezone: 'America/New_York',
        weekdays: [{ weekday: 1, isActive: true }],
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post(`/api/v1/upcoming-events/${SLUG}/class-package/checkout-session`)
      .send({
        monthIso: '2026-08',
        customerName: 'Guest User',
        customerEmail: 'guest@example.com',
      })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(String(body.message)).toMatch(/package|available/i);
  });

  it('POST fixed-event/checkout-session returns 409 when sold out', async () => {
    const event = {
      ...makeFixedTicketEventStub({
        id: FIXED_EVENT_ID,
        slug: FIXED_SLUG,
        price: 75,
      }),
      publicSection: EventPublicSection.UPCOMING_EVENTS,
      galleryPhotos: [],
    };
    harness.prisma.event.findFirst.mockResolvedValue(event);
    harness.prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
      makeFixedPublicCheckoutVenueStub({
        eventId: FIXED_EVENT_ID,
        fixedTicketCapacity: 2,
      }),
    );
    // assertFixedTicketCheckout remaining > 0, then createFixed remaining = 0
    harness.prisma.upcomingFixedEventEnrollment.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);

    const res = await request(harness.app.getHttpServer())
      .post(
        `/api/v1/upcoming-events/${FIXED_SLUG}/fixed-event/checkout-session`,
      )
      .send({
        customerName: 'Guest User',
        customerEmail: 'guest@example.com',
      })
      .expect(409);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(409);
    expect(String(body.message)).toMatch(/sold out/i);
  });
});
