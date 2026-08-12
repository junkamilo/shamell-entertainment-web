import {
  buildWebhookEventPayload,
  buildWebhookPayloadSummary,
  checkoutSessionFlow,
  isStripeAuditOnlyEventType,
  isStripeCheckoutBusinessEventType,
  parseChargeObject,
  parseCheckoutSession,
  parsePaymentIntentObject,
  redactStripePayload,
  resolveWebhookCheckoutSessionId,
  resolveWebhookMetadataFlow,
  resolveWebhookPurchaseCorrelationId,
} from './stripe-webhook.types';

describe('stripe-webhook.types', () => {
  it('parseCheckoutSession returns empty object for invalid input', () => {
    expect(parseCheckoutSession(null)).toEqual({});
    expect(parseCheckoutSession('bad')).toEqual({});
  });

  it('checkoutSessionFlow reads metadata.flow', () => {
    expect(
      checkoutSessionFlow({
        metadata: { flow: 'venue_seat' },
      }),
    ).toBe('venue_seat');
    expect(checkoutSessionFlow({ metadata: { flow: '  ' } })).toBeNull();
    expect(checkoutSessionFlow(null)).toBeNull();
  });

  it('resolveWebhookMetadataFlow prefers session then object metadata.flow', () => {
    expect(
      resolveWebhookMetadataFlow(
        {
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: { object: { metadata: { flow: 'ignored' } } },
        },
        { metadata: { flow: 'venue_seat' } },
      ),
    ).toBe('venue_seat');

    expect(
      resolveWebhookMetadataFlow(
        {
          id: 'evt_pi',
          type: 'payment_intent.created',
          livemode: false,
          data: {
            object: {
              id: 'pi_1',
              metadata: { flow: 'venue_seat' },
            },
          },
        },
        null,
      ),
    ).toBe('venue_seat');

    expect(
      resolveWebhookMetadataFlow(
        {
          id: 'evt_ch',
          type: 'charge.succeeded',
          livemode: false,
          data: {
            object: {
              id: 'ch_1',
              metadata: { flow: 'class_session' },
            },
          },
        },
        null,
      ),
    ).toBe('class_session');
  });
  it('classifies checkout business vs audit-only event types', () => {
    expect(
      isStripeCheckoutBusinessEventType('checkout.session.completed'),
    ).toBe(true);
    expect(isStripeCheckoutBusinessEventType('checkout.session.expired')).toBe(
      true,
    );
    expect(isStripeAuditOnlyEventType('payment_intent.succeeded')).toBe(true);
    expect(isStripeAuditOnlyEventType('charge.refunded')).toBe(true);
    expect(isStripeAuditOnlyEventType('invoice.paid')).toBe(false);
  });

  it('parsePaymentIntentObject reads id amount and cs_ order_reference', () => {
    expect(
      parsePaymentIntentObject({
        id: 'pi_1',
        status: 'succeeded',
        amount: 3500,
        currency: 'usd',
        latest_charge: 'ch_1',
        payment_details: { order_reference: 'cs_test_abc' },
      }),
    ).toEqual({
      id: 'pi_1',
      status: 'succeeded',
      amount: 3500,
      currency: 'usd',
      checkoutSessionId: 'cs_test_abc',
      latestChargeId: 'ch_1',
    });
    expect(
      parsePaymentIntentObject({
        id: 'pi_2',
        payment_details: { order_reference: 'not_a_session' },
      }).checkoutSessionId,
    ).toBeNull();
    expect(parsePaymentIntentObject(null).id).toBeNull();
  });

  it('parseChargeObject reads payment_intent refunded and checkoutSessionId metadata', () => {
    expect(
      parseChargeObject({
        id: 'ch_1',
        status: 'succeeded',
        amount: 3500,
        currency: 'usd',
        payment_intent: 'pi_1',
        refunded: false,
        metadata: { checkoutSessionId: 'cs_from_charge' },
      }),
    ).toEqual({
      id: 'ch_1',
      status: 'succeeded',
      amount: 3500,
      currency: 'usd',
      paymentIntentId: 'pi_1',
      checkoutSessionId: 'cs_from_charge',
      refunded: false,
    });
  });

  it('resolveWebhookCheckoutSessionId reads charge metadata.checkoutSessionId', () => {
    expect(
      resolveWebhookCheckoutSessionId(
        {
          id: 'evt_ch',
          type: 'charge.succeeded',
          livemode: false,
          data: {
            object: {
              id: 'ch_1',
              metadata: { checkoutSessionId: 'cs_from_charge_meta' },
            },
          },
        },
        null,
      ),
    ).toBe('cs_from_charge_meta');
  });

  it('resolveWebhookPurchaseCorrelationId prefers correlationId then checkoutSessionId', () => {
    expect(
      resolveWebhookPurchaseCorrelationId(
        {
          id: 'evt_1',
          type: 'payment_intent.created',
          livemode: false,
          data: {
            object: {
              metadata: { correlationId: 'corr-abc' },
            },
          },
        },
        null,
        null,
      ),
    ).toBe('corr-abc');

    expect(
      resolveWebhookPurchaseCorrelationId(
        {
          id: 'evt_2',
          type: 'charge.succeeded',
          livemode: false,
          data: { object: { metadata: {} } },
        },
        null,
        'cs_fallback',
      ),
    ).toBe('cs_fallback');
  });

  it('buildWebhookPayloadSummary includes enriched session fields', () => {
    const summary = buildWebhookPayloadSummary(
      {
        id: 'evt_1',
        type: 'checkout.session.completed',
        livemode: false,
        data: { object: {} },
      },
      {
        id: 'cs_1',
        metadata: { flow: 'class_session' },
        payment_intent: 'pi_session',
        payment_status: 'paid',
        amount_total: 5000,
        currency: 'usd',
      },
    );
    expect(summary).toEqual({
      type: 'checkout.session.completed',
      flow: 'class_session',
      purchaseCorrelationId: 'cs_1',
      checkoutSessionId: 'cs_1',
      paymentIntentId: 'pi_session',
      chargeId: null,
      paymentStatus: 'paid',
      stripeStatus: 'paid',
      amount: 5000,
      amountTotal: 5000,
      currency: 'usd',
    });
  });

  it('buildWebhookPayloadSummary enriches payment_intent timeline events', () => {
    const summary = buildWebhookPayloadSummary(
      {
        id: 'evt_pi',
        type: 'payment_intent.succeeded',
        livemode: false,
        data: {
          object: {
            id: 'pi_1',
            status: 'succeeded',
            amount: 3500,
            currency: 'usd',
            latest_charge: 'ch_1',
            metadata: {
              flow: 'venue_seat',
              correlationId: 'corr-1',
            },
            payment_details: { order_reference: 'cs_test_1' },
          },
        },
      },
      null,
    );
    expect(summary).toEqual({
      type: 'payment_intent.succeeded',
      flow: 'venue_seat',
      purchaseCorrelationId: 'corr-1',
      checkoutSessionId: 'cs_test_1',
      paymentIntentId: 'pi_1',
      chargeId: 'ch_1',
      paymentStatus: 'succeeded',
      stripeStatus: 'succeeded',
      amount: 3500,
      amountTotal: 3500,
      currency: 'usd',
    });
  });

  it('buildWebhookPayloadSummary enriches charge with checkoutSessionId and correlation', () => {
    const summary = buildWebhookPayloadSummary(
      {
        id: 'evt_ch',
        type: 'charge.succeeded',
        livemode: false,
        data: {
          object: {
            id: 'ch_1',
            status: 'succeeded',
            amount: 3500,
            currency: 'usd',
            payment_intent: 'pi_1',
            refunded: false,
            metadata: {
              flow: 'venue_seat',
              correlationId: 'corr-1',
              checkoutSessionId: 'cs_test_1',
            },
          },
        },
      },
      null,
    );
    expect(summary.purchaseCorrelationId).toBe('corr-1');
    expect(summary.checkoutSessionId).toBe('cs_test_1');
    expect(summary.flow).toBe('venue_seat');
  });

  it('buildWebhookPayloadSummary enriches charge timeline events', () => {
    const summary = buildWebhookPayloadSummary(
      {
        id: 'evt_ch',
        type: 'charge.refunded',
        livemode: false,
        data: {
          object: {
            id: 'ch_1',
            status: 'succeeded',
            amount: 3500,
            currency: 'usd',
            payment_intent: 'pi_1',
            refunded: true,
          },
        },
      },
      null,
    );
    expect(summary.chargeId).toBe('ch_1');
    expect(summary.paymentIntentId).toBe('pi_1');
    expect(summary.refunded).toBe(true);
  });

  it('parsePaymentIntentObject reads checkoutSessionId from metadata when order_reference missing', () => {
    expect(
      parsePaymentIntentObject({
        id: 'pi_meta',
        metadata: { checkoutSessionId: 'cs_from_meta' },
      }).checkoutSessionId,
    ).toBe('cs_from_meta');
  });

  it('buildWebhookEventPayload keeps previous_attributes null when absent', () => {
    expect(
      buildWebhookEventPayload({
        id: 'evt_1',
        type: 'payment_intent.created',
        livemode: false,
        data: { object: { id: 'pi_1' } },
      }),
    ).toEqual({
      object: { id: 'pi_1' },
      previous_attributes: null,
    });
    expect(
      buildWebhookEventPayload({
        id: 'evt_2',
        type: 'charge.updated',
        livemode: false,
        data: {
          object: { id: 'ch_1' },
          previous_attributes: { status: 'pending' },
        },
      }).previous_attributes,
    ).toEqual({ status: 'pending' });
  });

  it('redactStripePayload redacts client_secret recursively', () => {
    const redacted = redactStripePayload({
      object: {
        id: 'pi_1',
        client_secret: 'pi_secret_should_not_persist',
        nested: { secret: 'also_secret', ok: true },
      },
      previous_attributes: null,
    }) as {
      object: {
        client_secret: string;
        nested: { secret: string; ok: boolean };
      };
      previous_attributes: null;
    };
    expect(redacted.object.client_secret).toBe('[redacted]');
    expect(redacted.object.nested.secret).toBe('[redacted]');
    expect(redacted.object.nested.ok).toBe(true);
    expect(redacted.previous_attributes).toBeNull();
  });

  it('resolveWebhookCheckoutSessionId prefers session then PI order_reference', () => {
    expect(
      resolveWebhookCheckoutSessionId(
        {
          id: 'evt_1',
          type: 'checkout.session.completed',
          livemode: false,
          data: { object: {} },
        },
        { id: 'cs_from_session' },
      ),
    ).toBe('cs_from_session');

    expect(
      resolveWebhookCheckoutSessionId(
        {
          id: 'evt_pi',
          type: 'payment_intent.created',
          livemode: false,
          data: {
            object: {
              id: 'pi_1',
              payment_details: { order_reference: 'cs_from_pi' },
            },
          },
        },
        null,
      ),
    ).toBe('cs_from_pi');
  });
});
