"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { getStripePromise } from "@/lib/stripe/client";

type Props = {
  clientSecret: string;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

/**
 * Embedded Checkout iframe styling is controlled by Checkout Session
 * `branding_settings` on the server (see STRIPE_EMBEDDED_CHECKOUT_APPEARANCE).
 * The Elements `appearance` API is not supported on EmbeddedCheckoutProvider.
 */
export function StripeEmbeddedCheckout({ clientSecret }: Props) {
  const [stripe, setStripe] = useState<Stripe | null | undefined>(undefined);

  const providerOptions = useMemo(() => ({ clientSecret }), [clientSecret]);

  useEffect(() => {
    if (!publishableKey) {
      setStripe(null);
      return;
    }
    void getStripePromise().then(setStripe);
  }, []);

  if (!publishableKey || stripe === null) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p className="font-medium">Payment form could not load</p>
        <p className="mt-1 text-xs text-red-700/90">
          Add <code className="text-red-900">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to{" "}
          <code className="text-red-900">shamell-frontend/.env.local</code>, then restart{" "}
          <code className="text-red-900">npm run dev</code>.
        </p>
      </div>
    );
  }

  if (stripe === undefined) {
    return <div className="stripe-checkout-host__loading">Loading payment…</div>;
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripe} options={providerOptions}>
      <div className="stripe-embedded-checkout-mount">
        <EmbeddedCheckout />
      </div>
    </EmbeddedCheckoutProvider>
  );
}
