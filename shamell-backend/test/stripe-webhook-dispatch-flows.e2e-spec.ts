import { BadRequestException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { applyHttpObservability } from '../src/common/http/apply-http-observability';
import { BookingsService } from '../src/modules/bookings/services/bookings.service';
import {
  makeCheckoutSessionWebhookEvent,
  makeStripeWebhookEventLite,
} from '../src/modules/stripe/__mocks__/stripe.fixtures';
import { StripeWebhookAuditService } from '../src/modules/stripe/services/stripe-webhook-audit.service';
import { StripeService } from '../src/modules/stripe/services/stripe.service';
import { UpcomingEventsService } from '../src/modules/upcoming-events/services/upcoming-events.service';
import { StripeWebhookController } from '../src/modules/venue-reservations/controllers/stripe-webhook.controller';
import { StripeWebhookDispatchService } from '../src/modules/venue-reservations/services/stripe-webhook-dispatch.service';
import { VenueReservationsService } from '../src/modules/venue-reservations/services/venue-reservations.service';
import type {
  ErrorBody,
  WebhookDispatchBody,
} from '../src/modules/venue-reservations/testing/venue-reservations.test-types';

type DeepDispatchHarness = {
  app: INestApplication<App>;
  constructEvent: jest.Mock;
  audit: {
    isProcessed: jest.Mock;
    trackAttempt: jest.Mock;
    markProcessing: jest.Mock;
    markProcessed: jest.Mock;
    markFailed: jest.Mock;
  };
  bookings: { processStripeWebhookEvent: jest.Mock };
  venue: { processStripeWebhookEvent: jest.Mock };
};

async function createDeepDispatchHttpApp(): Promise<DeepDispatchHarness> {
  const constructEvent = jest.fn();
  const audit = {
    isProcessed: jest.fn().mockResolvedValue(false),
    trackAttempt: jest.fn().mockResolvedValue(undefined),
    markProcessing: jest.fn().mockResolvedValue(undefined),
    markProcessed: jest.fn().mockResolvedValue(undefined),
    markFailed: jest.fn().mockResolvedValue(undefined),
  };
  const bookings = {
    processStripeWebhookEvent: jest.fn().mockResolvedValue({ handled: true }),
  };
  const upcoming = {
    processClassStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ handled: true }),
    processClassPackageStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ handled: true }),
    processFixedStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ handled: true }),
  };
  const venue = {
    processStripeWebhookEvent: jest
      .fn()
      .mockResolvedValue({ received: true, handled: true }),
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
      { provide: BookingsService, useValue: bookings },
      { provide: UpcomingEventsService, useValue: upcoming },
      { provide: VenueReservationsService, useValue: venue },
    ],
  }).compile();

  const app = moduleRef.createNestApplication({
    rawBody: true,
  }) as unknown as INestApplication<App>;
  applyHttpObservability(app);
  app.setGlobalPrefix('api/v1');
  await app.init();

  return { app, constructEvent, audit, bookings, venue };
}

describe('Stripe webhook dispatch flows (deep e2e)', () => {
  let harness: DeepDispatchHarness;

  beforeEach(async () => {
    jest.clearAllMocks();
    harness = await createDeepDispatchHttpApp();
    harness.audit.isProcessed.mockResolvedValue(false);
    harness.bookings.processStripeWebhookEvent.mockResolvedValue({
      handled: true,
    });
    harness.venue.processStripeWebhookEvent.mockResolvedValue({
      received: true,
      handled: true,
    });
  });

  afterEach(async () => {
    await harness.app.close();
  });

  describe('Stripe webhook security checklist', () => {
    it('POST without stripe-signature returns 400', async () => {
      const res = await request(harness.app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .send({ id: 'evt_no_sig' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Missing stripe-signature header.');
      expect(harness.audit.trackAttempt).not.toHaveBeenCalled();
      expect(harness.constructEvent).not.toHaveBeenCalled();
    });

    it('POST with invalid signature returns 400', async () => {
      harness.constructEvent.mockImplementation(() => {
        throw new Error('bad sig');
      });

      const res = await request(harness.app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .set('stripe-signature', 'sig_bad')
        .send({ id: 'evt_bad_sig' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Invalid stripe-signature header.');
      expect(harness.audit.trackAttempt).not.toHaveBeenCalled();
    });

    it('POST with altered body (constructEvent throw) returns 400', async () => {
      harness.constructEvent.mockImplementation(() => {
        throw new Error(
          'No signatures found matching the expected signature for payload',
        );
      });

      const res = await request(harness.app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .set('stripe-signature', 'sig_for_other_body')
        .send({ id: 'evt_altered' })
        .expect(400);

      const body = res.body as ErrorBody;
      expect(body.message).toBe('Invalid stripe-signature header.');
      expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
    });

    it('POST test-mode event in production returns 400', async () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        harness.constructEvent.mockReturnValue(
          makeCheckoutSessionWebhookEvent({
            flow: 'venue_seat',
            eventId: 'evt_testmode_prod',
            livemode: false,
          }),
        );

        const res = await request(harness.app.getHttpServer())
          .post('/api/v1/stripe/webhook')
          .set('stripe-signature', 'sig_test')
          .send({ id: 'evt_testmode_prod' })
          .expect(400);

        const body = res.body as ErrorBody;
        expect(body.message).toBe(
          'Test-mode Stripe events are not accepted in production.',
        );
        expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
        expect(harness.audit.trackAttempt).not.toHaveBeenCalled();
      } finally {
        process.env.NODE_ENV = previous;
      }
    });

    it('POST replay of processed eventId returns deduplicated without domain handlers', async () => {
      harness.audit.isProcessed.mockResolvedValue(true);
      harness.constructEvent.mockReturnValue(
        makeCheckoutSessionWebhookEvent({
          flow: 'venue_seat',
          eventId: 'evt_dup_security',
        }),
      );

      const res = await request(harness.app.getHttpServer())
        .post('/api/v1/stripe/webhook')
        .set('stripe-signature', 'sig_test')
        .send({ id: 'evt_dup_security' })
        .expect(200);

      const body = res.body as WebhookDispatchBody;
      expect(body).toEqual({ received: true, deduplicated: true });
      expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
      expect(harness.bookings.processStripeWebhookEvent).not.toHaveBeenCalled();
      expect(harness.audit.trackAttempt).not.toHaveBeenCalled();
    });
  });

  it('POST /stripe/webhook venue_seat completed returns typed handler', async () => {
    harness.constructEvent.mockReturnValue(
      makeCheckoutSessionWebhookEvent({
        flow: 'venue_seat',
        eventId: 'evt_venue_deep',
      }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ id: 'evt_venue_deep' })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body).toEqual({
      received: true,
      handler: 'venue_seat',
      deduplicated: false,
    });
    expect(harness.venue.processStripeWebhookEvent).toHaveBeenCalled();
    expect(harness.audit.markProcessed).toHaveBeenCalledWith('evt_venue_deep');
  });

  it('POST /stripe/webhook booking_quote completed returns typed handler', async () => {
    harness.constructEvent.mockReturnValue(
      makeCheckoutSessionWebhookEvent({
        flow: 'booking_quote',
        eventId: 'evt_booking_deep',
      }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ id: 'evt_booking_deep' })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body.received).toBe(true);
    expect(body.handler).toBe('booking_quote');
    expect(harness.bookings.processStripeWebhookEvent).toHaveBeenCalled();
  });

  it('POST /stripe/webhook deduplicated returns typed body', async () => {
    harness.audit.isProcessed.mockResolvedValue(true);
    harness.constructEvent.mockReturnValue(
      makeCheckoutSessionWebhookEvent({ flow: 'venue_seat' }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ id: 'evt_dup' })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body).toEqual({ received: true, deduplicated: true });
    expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
  });

  it('POST /stripe/webhook payment_intent.succeeded is audit_only (200)', async () => {
    harness.constructEvent.mockReturnValue(
      makeStripeWebhookEventLite({
        id: 'evt_pi_deep',
        type: 'payment_intent.succeeded',
        livemode: true,
        data: { object: { id: 'pi_1' } },
      }),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ id: 'evt_pi_deep' })
      .expect(200);

    const body = res.body as WebhookDispatchBody;
    expect(body).toEqual({
      received: true,
      handler: 'audit_only',
      deduplicated: false,
    });
    expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
    expect(harness.audit.markProcessed).toHaveBeenCalledWith('evt_pi_deep');
  });

  it('POST /stripe/webhook domain throw marks failed and returns 400', async () => {
    harness.constructEvent.mockReturnValue(
      makeCheckoutSessionWebhookEvent({
        flow: 'venue_seat',
        eventId: 'evt_throw',
      }),
    );
    harness.venue.processStripeWebhookEvent.mockRejectedValue(
      new BadRequestException('venue domain failed'),
    );

    const res = await request(harness.app.getHttpServer())
      .post('/api/v1/stripe/webhook')
      .set('stripe-signature', 'sig_test')
      .send({ id: 'evt_throw' })
      .expect(400);

    const body = res.body as ErrorBody;
    expect(body.message).toBe('venue domain failed');
    expect(harness.audit.markFailed).toHaveBeenCalled();
  });
});
