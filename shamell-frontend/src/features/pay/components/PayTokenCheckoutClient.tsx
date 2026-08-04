"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StripeCheckoutHost } from "@/components/stripe";
import { PAY_CHECKOUT_LOADING_LABEL } from "../lib/payCopy";

export type PayTokenCheckoutFetchResult =
  | { ok: true; clientSecret: string }
  | { ok: false; message: string };

type Props = {
  token: string;
  ariaLabel: string;
  fetchClientSecret: (token: string) => Promise<PayTokenCheckoutFetchResult>;
};

export function PayTokenCheckoutClient({
  token,
  ariaLabel,
  fetchClientSecret,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSecret(token).then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setClientSecret(result.clientSecret);
    });
    return () => {
      cancelled = true;
    };
  }, [token, fetchClientSecret]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-4 py-16 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl text-gold">Payment unavailable</h1>
          <p className="mt-4 font-body text-sm text-foreground/75">{error}</p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg border border-gold/35 px-5 py-2.5 font-brand text-xs tracking-[0.14em] text-gold hover:bg-gold/10"
          >
            Return to home
          </Link>
        </div>
      </main>
    );
  }

  if (!clientSecret) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16">
        <p className="text-sm text-neutral-500">{PAY_CHECKOUT_LOADING_LABEL}</p>
      </main>
    );
  }

  return (
    <StripeCheckoutHost
      layout="page"
      clientSecret={clientSecret}
      ariaLabel={ariaLabel}
    />
  );
}
