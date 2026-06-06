import {
  buildWebhookPayloadSummary,
  checkoutSessionFlow,
  parseCheckoutSession,
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

  it('buildWebhookPayloadSummary includes session fields', () => {
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
        payment_status: 'paid',
        amount_total: 5000,
        currency: 'usd',
      },
    );
    expect(summary).toEqual({
      type: 'checkout.session.completed',
      flow: 'class_session',
      checkoutSessionId: 'cs_1',
      paymentStatus: 'paid',
      amountTotal: 5000,
      currency: 'usd',
    });
  });
});
