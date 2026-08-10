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

/** Completed (or expired) checkout.session webhook with metadata.flow set. */
export function makeCheckoutSessionWebhookEvent(args: {
  flow: string;
  type?: 'checkout.session.completed' | 'checkout.session.expired';
  eventId?: string;
  sessionId?: string;
  livemode?: boolean;
}): StripeWebhookEventLite {
  return makeStripeWebhookEventLite({
    id: args.eventId ?? `evt_${args.flow}`,
    type: args.type ?? 'checkout.session.completed',
    livemode: args.livemode ?? true,
    data: {
      object: makeStripeCheckoutSessionLite({
        id: args.sessionId ?? `cs_${args.flow}`,
        metadata: { flow: args.flow },
      }),
    },
  });
}
