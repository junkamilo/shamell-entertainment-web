import type {
  StripeCheckoutSessionLite,
  StripeWebhookEventLite,
} from '../types/stripe-webhook.types';

export function makeStripeWebhookEventLite(
  overrides: Partial<StripeWebhookEventLite> = {},
): StripeWebhookEventLite {
  return {
    id: 'evt_test_1',
    type: 'checkout.session.completed',
    livemode: false,
    data: { object: {} },
    ...overrides,
  };
}

export function makeStripeCheckoutSessionLite(
  overrides: Partial<StripeCheckoutSessionLite> = {},
): StripeCheckoutSessionLite {
  return {
    id: 'cs_test_1',
    metadata: { flow: 'booking_quote' },
    payment_intent: 'pi_test_1',
    payment_status: 'paid',
    amount_total: 10000,
    amount_subtotal: 10000,
    currency: 'usd',
    ...overrides,
  };
}
