export type StripeWebhookEventLite = {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: unknown };
};

export type StripeCheckoutSessionLite = {
  id?: string;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id?: string } | null;
  payment_status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
};

export type StripePaymentMethodDetails = {
  paymentMethodType: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
};

export function parseCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw as StripeCheckoutSessionLite;
}

export function checkoutSessionFlow(
  session: StripeCheckoutSessionLite | null,
): string | null {
  const flow = session?.metadata?.flow?.trim();
  return flow || null;
}

export function paymentIntentIdFromSession(
  session: StripeCheckoutSessionLite,
): string | null {
  const paymentIntent = session.payment_intent;
  if (typeof paymentIntent === 'string') return paymentIntent;
  return paymentIntent?.id ?? null;
}

export function buildWebhookPayloadSummary(
  event: StripeWebhookEventLite,
  session: StripeCheckoutSessionLite | null,
): Record<string, string | number | null> {
  const flow = checkoutSessionFlow(session);
  return {
    type: event.type,
    flow,
    checkoutSessionId: session?.id?.trim() ?? null,
    paymentStatus: session?.payment_status ?? null,
    amountTotal: session?.amount_total ?? null,
    currency: session?.currency ?? null,
  };
}
