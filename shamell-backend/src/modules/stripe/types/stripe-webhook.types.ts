export type StripeWebhookEventLite = {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: unknown; previous_attributes?: unknown };
};

export type StripeWebhookEventPayload = {
  object: unknown;
  previous_attributes: unknown;
};

const SENSITIVE_PAYLOAD_KEYS = new Set(['client_secret', 'secret', 'secrets']);

export function redactStripePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactStripePayload(item));
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_PAYLOAD_KEYS.has(key)) {
        out[key] = '[redacted]';
      } else {
        out[key] = redactStripePayload(nested);
      }
    }
    return out;
  }
  return value;
}

export function buildWebhookEventPayload(
  event: StripeWebhookEventLite,
): StripeWebhookEventPayload {
  return {
    object: event.data.object ?? null,
    previous_attributes:
      event.data.previous_attributes === undefined
        ? null
        : event.data.previous_attributes,
  };
}

export type StripeCheckoutSessionLite = {
  id?: string;
  metadata?: Record<string, string> | null;
  payment_intent?: string | { id?: string } | null;
  payment_status?: string | null;
  amount_total?: number | null;
  amount_subtotal?: number | null;
  currency?: string | null;
};

export type StripePaymentIntentLite = {
  id: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  checkoutSessionId: string | null;
  latestChargeId: string | null;
};

export type StripeChargeLite = {
  id: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  refunded: boolean | null;
};

export type StripePaymentMethodDetails = {
  paymentMethodType: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
};

export type StripeWebhookPayloadSummary = Record<
  string,
  string | number | boolean | null
>;

export const STRIPE_AUDIT_ONLY_EVENT_TYPES = [
  'payment_intent.created',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'charge.succeeded',
  'charge.updated',
  'charge.failed',
  'charge.refunded',
] as const;

export type StripeAuditOnlyEventType =
  (typeof STRIPE_AUDIT_ONLY_EVENT_TYPES)[number];

const AUDIT_ONLY_SET = new Set<string>(STRIPE_AUDIT_ONLY_EVENT_TYPES);

export function isStripeAuditOnlyEventType(type: string): boolean {
  return AUDIT_ONLY_SET.has(type);
}

export function isStripeCheckoutBusinessEventType(type: string): boolean {
  return (
    type === 'checkout.session.completed' || type === 'checkout.session.expired'
  );
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function checkoutSessionIdFromOrderReference(value: unknown): string | null {
  const ref = readString(value);
  if (!ref) return null;
  return ref.startsWith('cs_') ? ref : null;
}

export function parseCheckoutSession(raw: unknown): StripeCheckoutSessionLite {
  if (!raw || typeof raw !== 'object') {
    return {};
  }
  return raw;
}

export function checkoutSessionFlow(
  session: StripeCheckoutSessionLite | null,
): string | null {
  const flow = session?.metadata?.flow?.trim();
  return flow || null;
}

/** Reads `metadata.flow` from any Stripe object (Checkout, PI, Charge, …). */
export function metadataFlowFromObject(raw: unknown): string | null {
  return metadataStringFromObject(raw, 'flow');
}

export function metadataStringFromObject(
  raw: unknown,
  key: string,
): string | null {
  const metadata = asRecord(asRecord(raw)?.metadata);
  return readString(metadata?.[key]);
}

/**
 * Prefer Checkout Session flow; otherwise any `data.object.metadata.flow`
 * (PaymentIntent / Charge / future event objects).
 */
export function resolveWebhookMetadataFlow(
  event: StripeWebhookEventLite,
  session: StripeCheckoutSessionLite | null,
): string | null {
  return (
    checkoutSessionFlow(session) ?? metadataFlowFromObject(event.data.object)
  );
}

export function paymentIntentIdFromSession(
  session: StripeCheckoutSessionLite,
): string | null {
  const paymentIntent = session.payment_intent;
  if (typeof paymentIntent === 'string') return paymentIntent;
  return paymentIntent?.id ?? null;
}

export function parsePaymentIntentObject(
  raw: unknown,
): StripePaymentIntentLite {
  const obj = asRecord(raw);
  if (!obj) {
    return {
      id: null,
      status: null,
      amount: null,
      currency: null,
      checkoutSessionId: null,
      latestChargeId: null,
    };
  }

  const paymentDetails = asRecord(obj.payment_details);
  const metadata = asRecord(obj.metadata);
  const latestCharge = obj.latest_charge;
  const fromOrderRef = checkoutSessionIdFromOrderReference(
    paymentDetails?.order_reference,
  );
  const fromMetadata = checkoutSessionIdFromOrderReference(
    metadata?.checkoutSessionId,
  );

  return {
    id: readString(obj.id),
    status: readString(obj.status),
    amount: readNumber(obj.amount),
    currency: readString(obj.currency),
    checkoutSessionId: fromOrderRef ?? fromMetadata,
    latestChargeId:
      typeof latestCharge === 'string'
        ? readString(latestCharge)
        : readString(asRecord(latestCharge)?.id),
  };
}

export function parseChargeObject(raw: unknown): StripeChargeLite {
  const obj = asRecord(raw);
  if (!obj) {
    return {
      id: null,
      status: null,
      amount: null,
      currency: null,
      paymentIntentId: null,
      checkoutSessionId: null,
      refunded: null,
    };
  }

  const paymentIntent = obj.payment_intent;
  const metadata = asRecord(obj.metadata);

  return {
    id: readString(obj.id),
    status: readString(obj.status),
    amount: readNumber(obj.amount),
    currency: readString(obj.currency),
    paymentIntentId:
      typeof paymentIntent === 'string'
        ? readString(paymentIntent)
        : readString(asRecord(paymentIntent)?.id),
    checkoutSessionId: checkoutSessionIdFromOrderReference(
      metadata?.checkoutSessionId,
    ),
    refunded: readBoolean(obj.refunded),
  };
}

/**
 * Checkout Session id from the event object:
 * - session.id for checkout.*
 * - PI: payment_details.order_reference or metadata.checkoutSessionId
 * - Charge / any object: metadata.checkoutSessionId
 */
export function resolveWebhookCheckoutSessionId(
  event: StripeWebhookEventLite,
  session: StripeCheckoutSessionLite | null,
): string | null {
  if (session?.id?.trim()) return session.id.trim();

  if (event.type.startsWith('payment_intent.')) {
    return parsePaymentIntentObject(event.data.object).checkoutSessionId;
  }

  if (event.type.startsWith('charge.')) {
    return parseChargeObject(event.data.object).checkoutSessionId;
  }

  return checkoutSessionIdFromOrderReference(
    metadataStringFromObject(event.data.object, 'checkoutSessionId'),
  );
}

/**
 * Stable id shared by all webhook rows of one purchase.
 * Prefer metadata.correlationId (set at Checkout create); else checkoutSessionId.
 */
export function resolveWebhookPurchaseCorrelationId(
  event: StripeWebhookEventLite,
  session: StripeCheckoutSessionLite | null,
  checkoutSessionId: string | null,
): string | null {
  const fromSession = readString(session?.metadata?.correlationId ?? null);
  const fromObject = metadataStringFromObject(
    event.data.object,
    'correlationId',
  );
  return fromSession ?? fromObject ?? checkoutSessionId;
}

export function buildWebhookPayloadSummary(
  event: StripeWebhookEventLite,
  session: StripeCheckoutSessionLite | null,
): StripeWebhookPayloadSummary {
  const flow = resolveWebhookMetadataFlow(event, session);
  const checkoutSessionId = resolveWebhookCheckoutSessionId(event, session);
  const purchaseCorrelationId = resolveWebhookPurchaseCorrelationId(
    event,
    session,
    checkoutSessionId,
  );
  const fromSessionPi = session ? paymentIntentIdFromSession(session) : null;

  if (session) {
    return {
      type: event.type,
      flow,
      purchaseCorrelationId,
      checkoutSessionId: session.id?.trim() ?? null,
      paymentIntentId: fromSessionPi,
      chargeId: null,
      paymentStatus: session.payment_status ?? null,
      stripeStatus: session.payment_status ?? null,
      amount: session.amount_total ?? null,
      amountTotal: session.amount_total ?? null,
      currency: session.currency ?? null,
    };
  }

  if (event.type.startsWith('payment_intent.')) {
    const pi = parsePaymentIntentObject(event.data.object);
    return {
      type: event.type,
      flow,
      purchaseCorrelationId,
      checkoutSessionId: pi.checkoutSessionId,
      paymentIntentId: pi.id,
      chargeId: pi.latestChargeId,
      paymentStatus: pi.status,
      stripeStatus: pi.status,
      amount: pi.amount,
      amountTotal: pi.amount,
      currency: pi.currency,
    };
  }

  if (event.type.startsWith('charge.')) {
    const charge = parseChargeObject(event.data.object);
    return {
      type: event.type,
      flow,
      purchaseCorrelationId,
      checkoutSessionId: charge.checkoutSessionId,
      paymentIntentId: charge.paymentIntentId,
      chargeId: charge.id,
      paymentStatus: charge.status,
      stripeStatus: charge.status,
      amount: charge.amount,
      amountTotal: charge.amount,
      currency: charge.currency,
      refunded: charge.refunded,
    };
  }

  return {
    type: event.type,
    flow,
    purchaseCorrelationId,
    checkoutSessionId,
    paymentIntentId: null,
    chargeId: null,
    paymentStatus: null,
    stripeStatus: null,
    amount: null,
    amountTotal: null,
    currency: null,
  };
}
