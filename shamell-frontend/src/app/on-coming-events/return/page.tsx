"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { formatPriceEn } from "@/lib/pricing";
import { fetchVenueSessionStatus, type VenueSessionStatus } from "../services/fetchVenueSessionStatus";

function ReturnContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<VenueSessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session.");
      setLoading(false);
      return;
    }
    void (async () => {
      const result = await fetchVenueSessionStatus(sessionId);
      if (!result) {
        setError("Could not verify payment status.");
      } else {
        setStatus(result);
      }
      setLoading(false);
    })();
  }, [sessionId]);

  const isSuccess =
    status?.stripeStatus === "complete" || status?.reservation.status === "PAID";

  return (
    <main className="mx-auto max-w-lg px-4 pb-16 pt-28 text-center">
      {loading ? (
        <p className="text-shamell-muted">Confirming your reservation…</p>
      ) : error ? (
        <>
          <h1 className="font-display text-2xl text-shamell-danger">Something went wrong</h1>
          <p className="mt-3 text-sm text-shamell-muted">{error}</p>
        </>
      ) : isSuccess ? (
        <>
          <h1 className="font-display text-2xl text-shamell-gold">Reservation confirmed</h1>
          <p className="mt-3 text-sm text-shamell-muted">
            Thank you, {status?.reservation.customerName}. A confirmation was sent to{" "}
            {status?.reservation.customerEmail}.
          </p>
          {status?.reservation.tableName ? (
            <p className="mt-2 text-sm text-foreground">
              Table: <span className="font-semibold text-shamell-gold">{status.reservation.tableName}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-foreground">Standalone chair</p>
          )}
          <p className="mt-1 text-sm text-foreground">
            Total: {formatPriceEn(status?.reservation.amount ?? null)}
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl text-shamell-gold">Payment incomplete</h1>
          <p className="mt-3 text-sm text-shamell-muted">
            Your payment was not completed. You can return to the floor plan and try again.
          </p>
        </>
      )}

      <Link
        href="/on-coming-events"
        className="mt-8 inline-block rounded-lg bg-shamell-gold px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-black hover:bg-gold-light"
      >
        Back to floor plan
      </Link>
    </main>
  );
}

export default function VenueLayoutReturnPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="mx-auto max-w-lg px-4 pb-16 pt-28 text-center text-shamell-muted">
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
