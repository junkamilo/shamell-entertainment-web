"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { getStripePromise } from "@/lib/stripe/client";

type Props = {
  clientSecret: string;
};

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function VenueLayoutCheckoutStep({ clientSecret }: Props) {
  const [stripeReady, setStripeReady] = useState<boolean | null>(null);

  useEffect(() => {
    if (!publishableKey) {
      setStripeReady(false);
      return;
    }
    void getStripePromise().then((stripe) => setStripeReady(Boolean(stripe)));
  }, []);

  if (!publishableKey || stripeReady === false) {
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

  if (stripeReady === null) {
    return (
      <div className="flex min-h-[200px] items-center justify-center px-4 py-8 text-sm text-neutral-500">
        Loading payment…
      </div>
    );
  }

  return (
    <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ clientSecret }}>
      <div className="stripe-embedded-checkout-mount w-full">
        <EmbeddedCheckout />
      </div>
    </EmbeddedCheckoutProvider>
  );
}
