import type {
  StripeCheckoutSessionLite,
  StripePaymentMethodDetails,
} from './stripe-webhook.types';
import { paymentIntentIdFromSession } from './stripe-webhook.types';

export async function fetchPaymentMethodDetails(
  stripe: {
    paymentIntents: {
      retrieve: (
        id: string,
        params?: { expand?: string[] },
      ) => Promise<unknown>;
    };
  },
  session: StripeCheckoutSessionLite,
): Promise<StripePaymentMethodDetails> {
  const empty: StripePaymentMethodDetails = {
    paymentMethodType: null,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
  };
  const intentId = paymentIntentIdFromSession(session);
  if (!intentId) return empty;

  try {
    const intent = (await stripe.paymentIntents.retrieve(intentId, {
      expand: ['payment_method'],
    })) as {
      payment_method?:
        | string
        | { type?: string; card?: { brand?: string; last4?: string } }
        | null;
    };
    const pm = intent.payment_method;
    if (!pm || typeof pm === 'string') return empty;

    const type = pm.type ?? null;
    if (type === 'card' && pm.card) {
      return {
        paymentMethodType: 'card',
        paymentMethodBrand: pm.card.brand ?? null,
        paymentMethodLast4: pm.card.last4 ?? null,
      };
    }
    return {
      paymentMethodType: type,
      paymentMethodBrand: null,
      paymentMethodLast4: null,
    };
  } catch {
    return empty;
  }
}

export function formatPaymentMethodLabel(
  details: StripePaymentMethodDetails,
): string | null {
  const { paymentMethodType, paymentMethodBrand, paymentMethodLast4 } = details;
  if (!paymentMethodType) return null;
  if (
    paymentMethodType === 'card' &&
    paymentMethodBrand &&
    paymentMethodLast4
  ) {
    const brand =
      paymentMethodBrand.charAt(0).toUpperCase() + paymentMethodBrand.slice(1);
    return `${brand} •••• ${paymentMethodLast4}`;
  }
  if (paymentMethodLast4) {
    return `${paymentMethodType} •••• ${paymentMethodLast4}`;
  }
  return paymentMethodType;
}
