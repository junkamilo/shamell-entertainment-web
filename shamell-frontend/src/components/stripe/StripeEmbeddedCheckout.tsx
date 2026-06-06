"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { getStripePromise } from "@/lib/stripe/client";
import { useStripeCheckoutMount } from "./useStripeCheckoutMount";

type Props = {
  clientSecret: string;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export function StripeEmbeddedCheckout({ clientSecret }: Props) {
  const [stripe, setStripe] = useState<Stripe | null | undefined>(undefined);
  const mountRef = useRef<HTMLDivElement>(null);
  const providerOptions = useMemo(() => ({ clientSecret }), [clientSecret]);

  useStripeCheckoutMount(mountRef, stripe != null);

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
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-8 text-sm text-neutral-500">
        Loading payment…
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripe} options={providerOptions}>
      <div ref={mountRef} className="stripe-embedded-checkout-mount">
        <EmbeddedCheckout />
      </div>
    </EmbeddedCheckoutProvider>
  );
}
