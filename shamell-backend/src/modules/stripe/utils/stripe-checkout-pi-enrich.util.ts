import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { logCaughtError } from '../../../common/http/utils/log-caught-error.util';
import { paymentIntentIdFromSession } from '../types/stripe-webhook.types';

/** Minimal Stripe surface used to resolve/enrich PaymentIntents after Checkout create. */
export type StripeCheckoutPiClient = {
  checkout: {
    sessions: {
      retrieve: (
        id: string,
        params?: { expand?: string[] },
      ) => Promise<{
        payment_intent?: string | { id?: string } | null;
      }>;
    };
  };
  paymentIntents: {
    search: (params: {
      query: string;
      limit: number;
    }) => Promise<{ data?: Array<{ id?: string }> }>;
    update: (
      id: string,
      params: { metadata: Record<string, string> },
    ) => Promise<unknown>;
  };
};

export function buildCheckoutCorrelationMetadata(
  base: Record<string, string>,
): { correlationId: string; metadata: Record<string, string> } {
  const correlationId = randomUUID();
  return {
    correlationId,
    metadata: { ...base, correlationId },
  };
}

/**
 * Embedded Checkout often returns `payment_intent: null` on create even though
 * Stripe already created the PI. Resolve via retrieve expand, then Search.
 */
export async function resolvePaymentIntentIdForCheckoutSession(
  client: StripeCheckoutPiClient,
  args: {
    checkoutSessionId: string;
    paymentIntentFromSession: string | null;
    correlationId: string;
    logger?: Logger;
    opPrefix?: string;
  },
): Promise<string | null> {
  if (args.paymentIntentFromSession) {
    return args.paymentIntentFromSession;
  }

  const opPrefix = args.opPrefix ?? 'stripe.checkout';
  const logger = args.logger;

  try {
    const retrieved = await client.checkout.sessions.retrieve(
      args.checkoutSessionId,
      { expand: ['payment_intent'] },
    );
    const fromRetrieve = paymentIntentIdFromSession(retrieved);
    if (fromRetrieve) return fromRetrieve;
  } catch (err) {
    if (logger) {
      logCaughtError(logger, err, {
        op: `${opPrefix}.resolve_pi.retrieve`,
        level: 'warn',
        extra: { checkoutSessionId: args.checkoutSessionId },
      });
    }
  }

  try {
    const search = await client.paymentIntents.search({
      query: `metadata["correlationId"]:"${args.correlationId}"`,
      limit: 1,
    });
    const id = search.data?.[0]?.id?.trim();
    if (id) return id;
  } catch (err) {
    if (logger) {
      logCaughtError(logger, err, {
        op: `${opPrefix}.resolve_pi.search`,
        level: 'warn',
        extra: { correlationId: args.correlationId },
      });
    }
  }

  return null;
}

export async function attachPaymentIntentCheckoutMetadata(
  client: StripeCheckoutPiClient,
  args: {
    paymentIntentId: string;
    checkoutSessionId: string;
    metadata: Record<string, string>;
  },
): Promise<void> {
  await client.paymentIntents.update(args.paymentIntentId, {
    metadata: {
      ...args.metadata,
      checkoutSessionId: args.checkoutSessionId,
    },
  });
}
