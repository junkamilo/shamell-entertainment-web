import type { INestApplication } from '@nestjs/common';
import {
  BookingPaymentStage,
  BookingPaymentStatus,
  BookingStatus,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import {
  makePaidCheckoutSession,
  makeWebhookPaymentRow,
} from '../src/modules/bookings/__mocks__/bookings.fixtures';
import { BookingsService } from '../src/modules/bookings/services/bookings.service';
import { createBookingsWebhookServiceTestModule } from '../src/modules/bookings/testing/bookings-webhook-service.test-module';
import type { ErrorBody } from '../src/modules/bookings/testing/bookings.test-types';
import { makeCheckoutSessionWebhookEvent } from '../src/modules/stripe/__mocks__/stripe.fixtures';
import { StripeWebhookAuditService } from '../src/modules/stripe/services/stripe-webhook-audit.service';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import { StripeWebhookController } from '../src/modules/venue-reservations/controllers/stripe-webhook.controller';
import { StripeWebhookDispatchService } from '../src/modules/venue-reservations/services/stripe-webhook-dispatch.service';
import { VenueReservationsService } from '../src/modules/venue-reservations/services/venue-reservations.service';
import type { WebhookDispatchBody } from '../src/modules/venue-reservations/testing/venue-reservations.test-types';

type DeepWebhookHarness = {
  app: INestApplication<App>;
  constructEvent: jest.Mock;
  repository: Awaited<
    ReturnType<typeof createBookingsWebhookServiceTestModule>
  >['repository'];
  mail: Awaited<
    ReturnType<typeof createBookingsWebhookServiceTestModule>
  >['mail'];
  adminPaymentNotify: Awaited<
    ReturnType<typeof createBookingsWebhookServiceTestModule>
  >['adminPaymentNotify'];
};

async function createDeepBookingsWebhookHttpApp(): Promise<DeepWebhookHarness> {
  const webhookHarness = await createBookingsWebhookServiceTestModule();
  webhookHarness.repository.updateBookingPayment.mockResolvedValue(undefined);
  webhookHarness.repository.updateBooking.mockResolvedValue(undefined);
  webhookHarness.repository.findBookingAdminById.mockResolvedValue(null);

  const constructEvent = jest.fn();
  const audit = {
    isProcessed: jest.fn().mockResolvedValue(false),
    trackAttempt: jest.fn().mockResolvedValue(undefined),
    markProcessing: jest.fn().mockResolvedValue(undefined),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };

  const bookingsService = {
    processStripeWebhookEvent: (event: {
      id: string;
      type: string;
      data: { object: unknown };
    }) => webhookHarness.service.processStripeWebhookEvent(event),
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
      { provide: BookingsService, useValue: bookingsService },
      {
        provide: UpcomingEventsService,
        useValue: {
          processClassStripeWebhookEvent: jest
            .fn()
            .mockResolvedValue({ handled: false }),
          processClassPackageStripeWebhookEvent: jest
            .fn()
            .mockResolvedValue({ handled: false }),
          processFixedStripeWebhookEvent: jest
            .fn()
            .mockResolvedValue({ handled: false }),
        },
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
    repository: webhookHarness.repository,
    mail: webhookHarness.mail,
    adminPaymentNotify: webhookHarness.adminPaymentNotify,
  };
}

describe('Bookings webhook flows (deep e2e)', () => {
  let harness: DeepWebhookHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepBookingsWebhookHttpApp();
  });

  afterEach(async () => {
    await harness.app.close();
  });

  it('POST /stripe/webhook booking_quote completed marks FULL paid', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({
        stage: BookingPaymentStage.FULL,
        expectedAmount: 100,
        stripeCheckoutSessionId: 'cs_booking_quote',
      }),
    );
    harness.constructEvent.mockReturnValue(
      makeCheckoutSessionWebhookEvent({
        flow: 'booking_quote',
        sessionId: 'cs_booking_quote',
        eventId: 'evt_bq_full',
      }),
    );
    // Fixture default amount is 10000 cents = $100
    harness.constructEvent.mockReturnValue({
      id: 'evt_bq_full',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makePaidCheckoutSession({
          id: 'cs_booking_quote',
          amountCents: 10000,
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
    expect(body.handler).toBe('booking_quote');
    expect(body.deduplicated).toBe(false);
    expect(harness.repository.updateBooking).toHaveBeenCalledWith(
      'booking-1',
      expect.objectContaining({ status: BookingStatus.CONFIRMED }),
    );
    expect(
      harness.adminPaymentNotify.notifyPaymentOutcome,
    ).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'PAID' }));
  });

  it('POST /stripe/webhook booking_quote expired marks payment EXPIRED', async () => {
    harness.repository.findExpiredWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({
        status: BookingPaymentStatus.PENDING,
        stripeCheckoutSessionId: 'cs_bq_exp',
      }),
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_bq_exp',
      type: 'checkout.session.expired',
      livemode: true,
      data: {
        object: {
          id: 'cs_bq_exp',
          metadata: { flow: 'booking_quote' },
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
    expect(body.handler).toBe('booking_quote');
    expect(harness.repository.updateBookingPayment).toHaveBeenCalledWith(
      'payment-1',
      { status: BookingPaymentStatus.EXPIRED },
    );
  });

  it('POST /stripe/webhook booking_quote amount mismatch returns typed 400', async () => {
    harness.repository.findWebhookPaymentBySessionId.mockResolvedValue(
      makeWebhookPaymentRow({
        expectedAmount: 500,
        stripeCheckoutSessionId: 'cs_bq_bad',
      }),
    );
    harness.constructEvent.mockReturnValue({
      id: 'evt_bq_bad',
      type: 'checkout.session.completed',
      livemode: true,
      data: {
        object: makePaidCheckoutSession({
          id: 'cs_bq_bad',
          amountCents: 1000,
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
