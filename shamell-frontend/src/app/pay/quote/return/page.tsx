"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { formatPriceEn } from "@/lib/pricing";
import {
  fetchQuotePaymentSessionStatus,
  type QuotePaymentSessionStatus,
} from "../services/fetchQuoteCheckout";

function ReturnContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<QuotePaymentSessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      setLoading(false);
      return;
    }
    void (async () => {
      const result = await fetchQuotePaymentSessionStatus(sessionId);
      if (!result) {
        setError("Could not verify payment status.");
      } else {
        setStatus(result);
      }
      setLoading(false);
    })();
  }, [sessionId]);

  const isSuccess =
    status?.stripeStatus === "complete" || status?.paymentStatus === "PAID";

  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-28 text-center">
      {loading ? (
        <p className="text-foreground/60">Confirming your payment…</p>
      ) : error ? (
        <>
          <h1 className="font-display text-2xl text-red-300">Something went wrong</h1>
          <p className="mt-3 text-sm text-foreground/65">{error}</p>
        </>
      ) : isSuccess ? (
        <>
          <h1 className="font-display text-2xl text-gold">Payment confirmed</h1>
          <p className="mt-3 text-sm text-foreground/75">
            Thank you, {status?.customerName}. A confirmation was sent to{" "}
            {status?.customerEmail}.
          </p>
          <p className="mt-2 text-sm text-foreground">
            Amount:{" "}
            <span className="font-semibold text-gold">
              {formatPriceEn(status?.amount ?? null)}
            </span>
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl text-gold">Payment incomplete</h1>
          <p className="mt-3 text-sm text-foreground/65">
            Your payment was not completed. Please use the link in your email to try again.
          </p>
        </>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-lg border border-gold/35 px-5 py-2.5 font-brand text-xs tracking-[0.14em] text-gold hover:bg-gold/10"
      >
        Return to home
      </Link>
    </main>
  );
}

export default function PayQuoteReturnPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="mx-auto max-w-lg px-4 pb-16 pt-28 text-center text-foreground/60">
            Loading…
          </main>
        }
      >
        <ReturnContent />
      </Suspense>
      <Footer />
    </>
  );
}
