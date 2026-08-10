import type { INestApplication } from '@nestjs/common';
import { UpcomingClassEnrollmentStatus } from '@prisma/client';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { createPrismaMock, type PrismaMock } from '../src/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { BookingsService } from '../src/modules/bookings/services/bookings.service';
import { MailService } from '../src/modules/mail/services/mail.service';
import { AdminPaymentNotifyService } from '../src/modules/mail/services/admin-payment-notify.service';
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
import { UpcomingEventsRepository } from '../src/modules/upcoming-events/services/upcoming-events.repository';
import { UpcomingEventsWebhookService } from '../src/modules/upcoming-events/services/upcoming-events-webhook.service';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import type {
  ErrorBody,
  WebhookDispatchBody,
} from '../src/modules/upcoming-events/testing/upcoming-events.test-types';
import { StripeWebhookController } from '../src/modules/venue-reservations/controllers/stripe-webhook.controller';
import { StripeWebhookDispatchService } from '../src/modules/venue-reservations/services/stripe-webhook-dispatch.service';
import { VenueReservationsService } from '../src/modules/venue-reservations/services/venue-reservations.service';

type DeepRepoWebhookHarness = {
  app: INestApplication<App>;
  constructEvent: jest.Mock;
  prisma: PrismaMock;
  adminPaymentNotify: { notifyPaymentOutcome: jest.Mock };
  stripe: {
    client: {
      paymentIntents: { retrieve: jest.Mock };
    };
  };
};

/** Real repository + real webhook via Stripe dispatch (typed deep e2e). */
async function createDeepRepoWebhookHttpApp(): Promise<DeepRepoWebhookHarness> {
  const prisma = createPrismaMock();
  const constructEvent = jest.fn();
  const mail = {
    sendTransactional: jest.fn().mockResolvedValue({ ok: true }),
  };
  const adminPaymentNotify = {
    notifyPaymentOutcome: jest.fn().mockResolvedValue(undefined),
  };
  const stripeClient = {
    webhooks: { constructEvent },
    events: { retrieve: jest.fn() },
    paymentIntents: {
      retrieve: jest.fn().mockResolvedValue({
        payment_method: {
          type: 'card',
          card: { brand: 'visa', last4: '4242' },
        },
      }),
    },
    checkout: { sessions: { retrieve: jest.fn() } },
  };
  const audit = {
    isProcessed: jest.fn().mockResolvedValue(false),
    trackAttempt: jest.fn().mockResolvedValue(undefined),
    markProcessing: jest.fn().mockResolvedValue(undefined),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [StripeWebhookController],
    providers: [
      StripeWebhookDispatchService,
      UpcomingEventsRepository,
      UpcomingEventsWebhookService,
      {
        provide: PrismaService,
        useValue: prisma,
      },
      {
        provide: StripeService,
        useValue: {
          webhookSecret: 'whsec_test',
          client: stripeClient,
        },
      },
      { provide: MailService, useValue: mail },
      { provide: AdminPaymentNotifyService, useValue: adminPaymentNotify },
      { provide: StripeWebhookAuditService, useValue: audit },
      {
        provide: BookingsService,
        useValue: {
          processStripeWebhookEvent: jest
            .fn()
            .mockResolvedValue({ handled: false }),
        },
      },
      {
        provide: UpcomingEventsService,
        useFactory: (webhook: UpcomingEventsWebhookService) => ({
          processClassStripeWebhookEvent: (event: never) =>
            webhook.processClassStripeWebhookEvent(event),
          processClassPackageStripeWebhookEvent: (event: never) =>
            webhook.processClassPackageStripeWebhookEvent(event),
          processFixedStripeWebhookEvent: (event: never) =>
            webhook.processFixedStripeWebhookEvent(event),
        }),
        inject: [UpcomingEventsWebhookService],
      },
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
    prisma,
    adminPaymentNotify,
    stripe: { client: stripeClient },
  };
}

describe('Upcoming events repository flows (deep e2e)', () => {
  let harness: DeepRepoWebhookHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepRepoWebhookHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST /stripe/webhook class_session completed uses real repository PAID update', async () => {
    const enrollment = makeClassEnrollmentWebhookInclude();
    harness.prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
      enrollment,
    );
    harness.prisma.upcomingClassEnrollment.update.mockResolvedValue({
      ...enrollment,
      status: UpcomingClassEnrollmentStatus.PAID,
    });
    harness.constructEvent.mockReturnValue({
      id: 'evt_repo_class',
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
    expect(harness.prisma.upcomingClassEnrollment.update).toHaveBeenCalled();
  });

  it('POST /stripe/webhook class_session_bundle completed is handled via repo', async () => {
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
        eventId: 'evt_repo_pkg',
      }),
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_repo_pkg',
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
    expect(body.handler).toBe('class_session_bundle');
    expect(
      harness.prisma.upcomingClassPackageEnrollment.update,
    ).toHaveBeenCalled();
  });

  it('POST /stripe/webhook fixed_event_ticket completed is handled via repo', async () => {
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
    harness.constructEvent.mockReturnValue({
      id: 'evt_repo_fixed',
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
    expect(body.handler).toBe('fixed_event_ticket');
    expect(harness.adminPaymentNotify.notifyPaymentOutcome).toHaveBeenCalled();
  });

  it('POST /stripe/webhook class_session amount mismatch returns typed 400', async () => {
    harness.prisma.upcomingClassEnrollment.findUnique.mockResolvedValue(
      makeClassEnrollmentWebhookInclude({ amount: 50 }),
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_repo_bad',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makeStripeCheckoutSessionLite({
          id: 'cs_bad',
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
});
