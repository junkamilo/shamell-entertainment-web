import type { INestApplication } from '@nestjs/common';
import { UpcomingClassEnrollmentStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { BookingsService } from '../src/modules/bookings/services/bookings.service';
import { makeCheckoutSessionWebhookEvent } from '../src/modules/stripe/__mocks__/stripe.fixtures';
import { StripeWebhookAuditService } from '../src/modules/stripe/services/stripe-webhook-audit.service';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import {
  makeClassEnrollmentWebhookInclude,
  makeClassPackageWebhookInclude,
  makeFixedEnrollmentWebhookInclude,
  makeStripeCheckoutSessionLite,
  makeVenueConfigStub,
} from '../src/modules/upcoming-events/__mocks__/upcoming-events.fixtures';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import type {
  ErrorBody,
  WebhookDispatchBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';
import { createUpcomingEventsWebhookServiceTestModule } from '../src/modules/upcoming-events/testing/upcoming-events-webhook-service.test-module';
import { StripeWebhookController } from '../src/modules/venue-reservations/controllers/stripe-webhook.controller';
import { StripeWebhookDispatchService } from '../src/modules/venue-reservations/services/stripe-webhook-dispatch.service';
import { VenueReservationsService } from '../src/modules/venue-reservations/services/venue-reservations.service';

type DeepWebhookHarness = {
  app: INestApplication<App>;
  constructEvent: jest.Mock;
  prisma: Awaited<
    ReturnType<typeof createUpcomingEventsWebhookServiceTestModule>
  >['prisma'];
  mail: Awaited<
    ReturnType<typeof createUpcomingEventsWebhookServiceTestModule>
  >['mail'];
  adminPaymentNotify: Awaited<
    ReturnType<typeof createUpcomingEventsWebhookServiceTestModule>
  >['adminPaymentNotify'];
  stripe: Awaited<
    ReturnType<typeof createUpcomingEventsWebhookServiceTestModule>
  >['stripe'];
};

async function createDeepUpcomingWebhookHttpApp(): Promise<DeepWebhookHarness> {
  const webhookHarness = await createUpcomingEventsWebhookServiceTestModule();
  const constructEvent = jest.fn();
  const audit = {
    isProcessed: jest.fn().mockResolvedValue(false),
    trackAttempt: jest.fn().mockResolvedValue(undefined),
    markProcessing: jest.fn().mockResolvedValue(undefined),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };

  const upcomingEventsService = {
    processClassStripeWebhookEvent: (
      event: Parameters<
        typeof webhookHarness.service.processClassStripeWebhookEvent
      >[0],
    ) => webhookHarness.service.processClassStripeWebhookEvent(event),
    processClassPackageStripeWebhookEvent: (
      event: Parameters<
        typeof webhookHarness.service.processClassPackageStripeWebhookEvent
      >[0],
    ) => webhookHarness.service.processClassPackageStripeWebhookEvent(event),
    processFixedStripeWebhookEvent: (
      event: Parameters<
        typeof webhookHarness.service.processFixedStripeWebhookEvent
      >[0],
    ) => webhookHarness.service.processFixedStripeWebhookEvent(event),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [StripeWebhookController],
    providers: [
      StripeWebhookDispatchService,
      {
        provide: StripeService,
        useValue: {
          webhookSecret: 'whsec_test',
          client: {
            webhooks: { constructEvent },
            events: { retrieve: jest.fn() },
          },
        },
      },
      { provide: StripeWebhookAuditService, useValue: audit },
      {
        provide: BookingsService,
        useValue: {
          processStripeWebhookEvent: jest
            .fn()
            .mockResolvedValue({ handled: false }),
        },
      },
      { provide: UpcomingEventsService, useValue: upcomingEventsService },
      {
        provide: VenueReservationsService,
        useValue: {
          processStripeWebhookEvent: jest
            .fn()
            .mockResolvedValue({ received: true, handled: false }),
        },
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication({
    rawBody: true,
  }) as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();

  return {
    app,
    constructEvent,
    prisma: webhookHarness.prisma,
    mail: webhookHarness.mail,
    adminPaymentNotify: webhookHarness.adminPaymentNotify,
    stripe: webhookHarness.stripe,
  };
}

describe('Upcoming events webhook flows (deep e2e)', () => {
  let harness: DeepWebhookHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepUpcomingWebhookHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST /stripe/webhook class_session completed marks enrollment PAID', async () => {
    const enrollment = makeClassEnrollmentWebhookInclude();
    harness.prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
      enrollment,
    );
    harness.prisma.upcomingClassEnrollment.update.mockResolvedValue({
      ...enrollment,
      status: UpcomingClassEnrollmentStatus.PAID,
    });
    harness.constructEvent.mockReturnValue({
      id: 'evt_ue_class',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_class_1',
          amount_total: 5000,
          metadata: { flow: 'class_session' },
        }),
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ raw: true })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body.received).toBe(true);
    expect(body.handler).toBe('class_session');
    expect(body.deduplicated).toBe(false);
    const updateCalls = harness.prisma.upcomingClassEnrollment.update.mock
      .calls as Array<[{ data: { status: UpcomingClassEnrollmentStatus } }]>;
    expect(updateCalls[0][0].data.status).toBe(
      UpcomingClassEnrollmentStatus.PAID,
    );
    expect(
      harness.adminPaymentNotify.notifyPaymentOutcome,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'PAID', flow: 'CLASS_SESSION' }),
    );
  });

  it('POST /stripe/webhook class_session_bundle completed is handled', async () => {
    const pkg = makeClassPackageWebhookInclude({ itemCount: 2 });
    harness.prisma.upcomingClassPackageEnrollment.findUnique
      .mockResolvedValueOnce(pkg)
      .mockResolvedValueOnce({
        ...pkg,
        status: UpcomingClassEnrollmentStatus.PAID,
      });
    harness.constructEvent.mockReturnValue(
      makeCheckoutSessionWebhookEvent({
        flow: 'class_session_bundle',
        sessionId: 'cs_pkg_1',
        eventId: 'evt_ue_pkg',
      }),
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_ue_pkg',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_pkg_1',
          amount_total: 10_000,
          metadata: { flow: 'class_session_bundle' },
        }),
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ raw: true })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body.received).toBe(true);
    expect(body.handler).toBe('class_session_bundle');
    expect(
      harness.prisma.upcomingClassPackageEnrollment.update,
    ).toHaveBeenCalled();
  });

  it('POST /stripe/webhook fixed_event_ticket completed is handled', async () => {
    const enrollment = makeFixedEnrollmentWebhookInclude();
    harness.prisma.upcomingFixedEventEnrollment.findUnique
      .mockResolvedValueOnce(enrollment)
      .mockResolvedValueOnce({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 1,
      })
      .mockResolvedValueOnce({
        ...enrollment,
        status: UpcomingClassEnrollmentStatus.PAID,
        ticketNumber: 1,
        customerEmailSentAt: null,
        adminNotifySentAt: null,
      });
    harness.prisma.upcomingVenueConfig.findUnique.mockResolvedValue(
      makeVenueConfigStub({ eventId: enrollment.eventId }),
    );
    harness.prisma.$transaction.mockImplementation(
      (fn: (tx: unknown) => unknown) => {
        const tx = {
          upcomingFixedEventEnrollment: {
            findUnique: jest.fn().mockResolvedValue({
              ...enrollment,
              status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
              ticketNumber: null,
            }),
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            aggregate: jest
              .fn()
              .mockResolvedValue({ _max: { ticketNumber: 0 } }),
            update: jest.fn(),
            count: jest.fn().mockResolvedValue(0),
          },
        };
        return Promise.resolve(fn(tx));
      },
    );
    harness.stripe.client.paymentIntents.retrieve.mockResolvedValue({
      payment_method: {
        type: 'card',
        card: { brand: 'visa', last4: '4242' },
      },
    });
    harness.constructEvent.mockReturnValue({
      id: 'evt_ue_fixed',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_fixed_1',
          amount_total: 2500,
          metadata: { flow: 'fixed_event_ticket' },
        }),
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ raw: true })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body.received).toBe(true);
    expect(body.handler).toBe('fixed_event_ticket');
    expect(
      harness.adminPaymentNotify.notifyPaymentOutcome,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'PAID', flow: 'FIXED_TICKET' }),
    );
  });

  it('POST /stripe/webhook class_session amount mismatch returns typed 400', async () => {
    harness.prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
      makeClassEnrollmentWebhookInclude({ amount: 50 }),
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_ue_mismatch',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_class_bad',
          amount_total: 999,
          metadata: { flow: 'class_session' },
        }),
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ raw: true })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.statusCode).toBe(400);
    expect(String(body.message)).toMatch(/mismatch|Amount/i);
  });

  it('POST /stripe/webhook class_session expired marks EXPIRED', async () => {
    const enrollment = makeClassEnrollmentWebhookInclude();
    harness.prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
      enrollment,
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_ue_exp',
      type: 'checkout.session.expired',
      livemode: true,
      data: {
        object: {
          id: 'cs_class_exp',
          metadata: { flow: 'class_session' },
        },
      },
    });

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ raw: true })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body.received).toBe(true);
    expect(body.handler).toBe('class_session');
    expect(harness.prisma.upcomingClassEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: UpcomingClassEnrollmentStatus.EXPIRED },
      }),
    );
  });
});
