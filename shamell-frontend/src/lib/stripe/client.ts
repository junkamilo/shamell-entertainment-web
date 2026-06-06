import { loadStripe } from "@stripe/stripe-js/pure";
import type { Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;
let loadParametersSet = false;

function ensureStripeLoadParameters() {
  if (loadParametersSet) return;
  loadStripe.setLoadParameters({
    advancedFraudSignals: false,
  });
  loadParametersSet = true;
}

export function getStripePromise(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) {
    ensureStripeLoadParameters();
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}
