import { BadRequestException } from '@nestjs/common';
import {
  makeCheckoutSessionWebhookEvent,
  makeStripeWebhookEventLite,
} from '../../stripe/__mocks__/stripe.fixtures';
import {
  createStripeWebhookDispatchServiceTestModule,
  type StripeWebhookDispatchServiceTestHarness,
} from '../testing/stripe-webhook-dispatch-service.test-module';
import { StripeWebhookDispatchService } from './stripe-webhook-dispatch.service';

describe('StripeWebhookDispatchService', () => {
  let harness: StripeWebhookDispatchServiceTestHarness;
  let service: StripeWebhookDispatchService;

  beforeEach(async () => {
    harness = await createStripeWebhookDispatchServiceTestModule();
    service = harness.service;
    jest.clearAllMocks();
    harness.audit.isProcessed.mockResolvedValue(false);
    harness.bookings.processStripeWebhookEvent.mockResolvedValue({
      handled: true,
    });
    harness.upcoming.processClassStripeWebhookEvent.mockResolvedValue({
      handled: true,
    });
    harness.upcoming.processClassPackageStripeWebhookEvent.mockResolvedValue({
      handled: true,
    });
    harness.upcoming.processFixedStripeWebhookEvent.mockResolvedValue({
      handled: true,
    });
    harness.venue.processStripeWebhookEvent.mockResolvedValue({
      received: true,
      handled: true,
    });
  });

  function wireConstructedEvent(
    event: ReturnType<typeof makeStripeWebhookEventLite>,
  ) {
    harness.constructEvent.mockReturnValue(event);
  }

  async function handleEvent(
    event: ReturnType<typeof makeStripeWebhookEventLite>,
  ) {
    wireConstructedEvent(event);
    return service.handle(Buffer.from('{}'), 'sig_test');
  }

  describe('Stripe webhook security checklist', () => {
    it('rejects missing stripe-signature header', async () => {
      await expect(
        service.handle(Buffer.from('{}'), undefined),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects invalid constructEvent signature', async () => {
      harness.constructEvent.mockImplementation(() => {
        throw new Error('bad sig');
      });

      await expect(
        service.handle(Buffer.from('{}'), 'sig_bad'),
      ).rejects.toThrow('Invalid stripe-signature header.');
      expect(harness.audit.trackAttempt).not.toHaveBeenCalled();
    });

    it('rejects test-mode events in production', async () => {
      const previous = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      wireConstructedEvent(
        makeCheckoutSessionWebhookEvent({
          flow: 'venue_seat',
          livemode: false,
        }),
      );

      await expect(
        service.handle(Buffer.from('{}'), 'sig_test'),
      ).rejects.toThrow(
        'Test-mode Stripe events are not accepted in production.',
      );

      process.env.NODE_ENV = previous;
    });

    it('returns deduplicated when event already processed', async () => {
      harness.audit.isProcessed.mockResolvedValueOnce(true);
      wireConstructedEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'venue_seat' }),
      );

      await expect(
        service.handle(Buffer.from('{}'), 'sig_test'),
      ).resolves.toEqual({ received: true, deduplicated: true });
      expect(harness.audit.trackAttempt).not.toHaveBeenCalled();
    });
  });

  describe('dispatch by metadata.flow', () => {
    it('routes booking_quote to bookings handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'booking_quote' }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'booking_quote',
        deduplicated: false,
      });
      expect(harness.bookings.processStripeWebhookEvent).toHaveBeenCalled();
      expect(harness.audit.markProcessing).toHaveBeenCalledWith(
        'evt_booking_quote',
        'booking_quote',
      );
      expect(harness.audit.markProcessed).toHaveBeenCalledWith(
        'evt_booking_quote',
      );
    });

    it('routes class_session to upcoming class handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'class_session' }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'class_session',
        deduplicated: false,
      });
      expect(
        harness.upcoming.processClassStripeWebhookEvent,
      ).toHaveBeenCalled();
    });

    it('routes class_package to package handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'class_package' }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'class_package',
        deduplicated: false,
      });
      expect(
        harness.upcoming.processClassPackageStripeWebhookEvent,
      ).toHaveBeenCalled();
    });

    it('routes class_session_bundle alias to package handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'class_session_bundle' }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'class_session_bundle',
        deduplicated: false,
      });
      expect(
        harness.upcoming.processClassPackageStripeWebhookEvent,
      ).toHaveBeenCalled();
    });

    it('routes fixed_event_ticket to fixed handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'fixed_event_ticket' }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'fixed_event_ticket',
        deduplicated: false,
      });
      expect(
        harness.upcoming.processFixedStripeWebhookEvent,
      ).toHaveBeenCalled();
    });

    it('routes venue_seat to venue reservations handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({ flow: 'venue_seat' }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'venue_seat',
        deduplicated: false,
      });
      expect(harness.venue.processStripeWebhookEvent).toHaveBeenCalled();
      expect(harness.audit.markProcessed).toHaveBeenCalled();
    });

    it('routes checkout.session.expired venue_seat to venue handler', async () => {
      const result = await handleEvent(
        makeCheckoutSessionWebhookEvent({
          flow: 'venue_seat',
          type: 'checkout.session.expired',
          eventId: 'evt_expired_venue',
        }),
      );

      expect(result).toEqual({
        received: true,
        handler: 'venue_seat',
        deduplicated: false,
      });
      expect(harness.venue.processStripeWebhookEvent).toHaveBeenCalled();
    });
  });

  describe('audit-only timeline events', () => {
    const auditOnlyTypes = [
      'payment_intent.created',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.succeeded',
      'charge.updated',
      'charge.failed',
      'charge.refunded',
    ] as const;

    it.each(auditOnlyTypes)(
      '%s is PROCESSED as audit_only without domain handlers',
      async (type) => {
        const result = await handleEvent(
          makeStripeWebhookEventLite({
            id: `evt_${type}`,
            type,
            livemode: true,
            data: {
              object: type.startsWith('payment_intent.')
                ? {
                    id: 'pi_1',
                    status: 'succeeded',
                    amount: 3500,
                    currency: 'usd',
                    metadata: {
                      flow: 'venue_seat',
                      correlationId: 'corr-shared',
                      checkoutSessionId: 'cs_test_linked',
                    },
                    payment_details: {
                      order_reference: 'cs_test_linked',
                    },
                  }
                : {
                    id: 'ch_1',
                    status: 'succeeded',
                    amount: 3500,
                    currency: 'usd',
                    payment_intent: 'pi_1',
                    metadata: {
                      flow: 'venue_seat',
                      correlationId: 'corr-shared',
                      checkoutSessionId: 'cs_test_linked',
                    },
                    refunded: type === 'charge.refunded',
                  },
            },
          }),
        );

        expect(result).toEqual({
          received: true,
          handler: 'audit_only',
          deduplicated: false,
        });
        expect(
          harness.bookings.processStripeWebhookEvent,
        ).not.toHaveBeenCalled();
        expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
        expect(
          harness.upcoming.processClassStripeWebhookEvent,
        ).not.toHaveBeenCalled();
        expect(harness.audit.markProcessing).toHaveBeenCalledWith(
          `evt_${type}`,
          'audit_only',
        );
        expect(harness.audit.markProcessed).toHaveBeenCalledWith(`evt_${type}`);
        expect(harness.audit.markFailed).not.toHaveBeenCalled();
        expect(harness.audit.trackAttempt).toHaveBeenCalledWith(
          expect.objectContaining({ id: `evt_${type}` }),
          expect.objectContaining({
            metadataFlow: 'venue_seat',
            checkoutSessionId: 'cs_test_linked',
            purchaseCorrelationId: 'corr-shared',
            payloadSummary: expect.objectContaining({
              flow: 'venue_seat',
              purchaseCorrelationId: 'corr-shared',
              checkoutSessionId: 'cs_test_linked',
            }) as Record<string, unknown>,
          }),
        );
      },
    );

    it('payment_intent.succeeded trackAttempt includes checkoutSessionId from order_reference', async () => {
      await handleEvent(
        makeStripeWebhookEventLite({
          id: 'evt_pi_cs',
          type: 'payment_intent.succeeded',
          livemode: true,
          data: {
            object: {
              id: 'pi_1',
              status: 'succeeded',
              amount: 3500,
              currency: 'usd',
              metadata: {
                flow: 'venue_seat',
                correlationId: 'corr-pi',
              },
              payment_details: { order_reference: 'cs_test_linked' },
            },
          },
        }),
      );

      expect(harness.audit.trackAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'evt_pi_cs' }),
        expect.objectContaining({
          metadataFlow: 'venue_seat',
          checkoutSessionId: 'cs_test_linked',
          purchaseCorrelationId: 'corr-pi',
          payloadSummary: expect.objectContaining({
            flow: 'venue_seat',
            paymentIntentId: 'pi_1',
            checkoutSessionId: 'cs_test_linked',
            purchaseCorrelationId: 'corr-pi',
          }) as Record<string, unknown>,
          payload: expect.objectContaining({
            object: expect.objectContaining({ id: 'pi_1' }) as Record<
              string,
              unknown
            >,
            previous_attributes: null,
          }) as Record<string, unknown>,
        }),
      );
    });

    it('audit_only trackAttempt stores redacted payload without client_secret', async () => {
      await handleEvent(
        makeStripeWebhookEventLite({
          id: 'evt_pi_created',
          type: 'payment_intent.created',
          livemode: true,
          data: {
            object: {
              id: 'pi_secret',
              client_secret: 'pi_should_not_persist',
              status: 'requires_payment_method',
            },
          },
        }),
      );

      expect(harness.audit.trackAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'evt_pi_created' }),
        expect.objectContaining({
          payload: {
            object: {
              id: 'pi_secret',
              client_secret: '[redacted]',
              status: 'requires_payment_method',
            },
            previous_attributes: null,
          },
        }),
      );
    });
  });

  describe('unknown / unhandled', () => {
    it('invoice.paid remains unhandled and markFailed', async () => {
      await expect(
        handleEvent(
          makeStripeWebhookEventLite({
            id: 'evt_invoice',
            type: 'invoice.paid',
            livemode: true,
            data: { object: { id: 'in_1' } },
          }),
        ),
      ).rejects.toThrow(/Unhandled Stripe webhook/i);

      expect(harness.bookings.processStripeWebhookEvent).not.toHaveBeenCalled();
      expect(harness.venue.processStripeWebhookEvent).not.toHaveBeenCalled();
      expect(harness.audit.markFailed).toHaveBeenCalled();
      expect(harness.audit.markProcessed).not.toHaveBeenCalled();
    });

    it('completed without metadata.flow is unhandled and markFailed', async () => {
      await expect(
        handleEvent(
          makeStripeWebhookEventLite({
            id: 'evt_no_flow',
            type: 'checkout.session.completed',
            livemode: true,
            data: { object: { id: 'cs_1', metadata: {} } },
          }),
        ),
      ).rejects.toThrow(/Unhandled Stripe webhook/i);

      expect(harness.audit.markFailed).toHaveBeenCalled();
    });

    it('unknown flow string is unhandled and markFailed', async () => {
      await expect(
        handleEvent(
          makeCheckoutSessionWebhookEvent({
            flow: 'unknown_flow',
            eventId: 'evt_unknown',
          }),
        ),
      ).rejects.toThrow(/Unhandled Stripe webhook/i);

      expect(harness.audit.markFailed).toHaveBeenCalled();
    });

    it('domain returns handled false is unhandled and markFailed', async () => {
      harness.bookings.processStripeWebhookEvent.mockResolvedValue({
        handled: false,
      });

      await expect(
        handleEvent(makeCheckoutSessionWebhookEvent({ flow: 'booking_quote' })),
      ).rejects.toThrow(/Unhandled Stripe webhook/i);

      expect(harness.audit.markFailed).toHaveBeenCalled();
      expect(harness.audit.markProcessed).not.toHaveBeenCalled();
    });
  });

  describe('failure / reprocess', () => {
    it('domain throw marks failed and rethrows', async () => {
      harness.venue.processStripeWebhookEvent.mockRejectedValue(
        new Error('venue boom'),
      );

      await expect(
        handleEvent(makeCheckoutSessionWebhookEvent({ flow: 'venue_seat' })),
      ).rejects.toThrow('venue boom');

      expect(harness.audit.markFailed).toHaveBeenCalled();
      expect(harness.audit.markProcessed).not.toHaveBeenCalled();
    });

    it('reprocessFromStripeEventId returns false when already processed', async () => {
      harness.audit.isProcessed.mockResolvedValueOnce(true);

      await expect(
        service.reprocessFromStripeEventId('evt_done'),
      ).resolves.toBe(false);
      expect(harness.retrieveEvent).not.toHaveBeenCalled();
    });

    it('reprocessFromStripeEventId retrieves and processes successfully', async () => {
      const event = makeCheckoutSessionWebhookEvent({
        flow: 'venue_seat',
        eventId: 'evt_retry',
      });
      harness.retrieveEvent.mockResolvedValue(event);

      await expect(
        service.reprocessFromStripeEventId('evt_retry'),
      ).resolves.toBe(true);

      expect(harness.retrieveEvent).toHaveBeenCalledWith('evt_retry');
      expect(harness.venue.processStripeWebhookEvent).toHaveBeenCalled();
      expect(harness.audit.markProcessed).toHaveBeenCalledWith('evt_retry');
    });
  });
});
