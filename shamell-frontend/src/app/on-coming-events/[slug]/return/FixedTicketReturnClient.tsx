"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getPublicApiBaseUrl } from "@/app/on-coming-events/lib/apiBaseUrl";
import { onComingEventDetailHref, onComingEventHubHref } from "@/lib/upcomingEventPublicRoutes";

function FixedTicketReturnInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    const base = getPublicApiBaseUrl();
    fetch(
      `${base}/api/v1/fixed-event-enrollments/session-status?session_id=${encodeURIComponent(sessionId)}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object") {
          setStatus("error");
          return;
        }
        const o = data as Record<string, unknown>;
        const enrollment =
          o.enrollment && typeof o.enrollment === "object"
            ? (o.enrollment as Record<string, unknown>)
            : null;
        const stripeStatus = o.stripeStatus;
        const enStatus = enrollment?.status;
        if (typeof enrollment?.ticketNumber === "number") {
          setTicketNumber(enrollment.ticketNumber);
        }
        if (stripeStatus === "complete" || enStatus === "PAID") setStatus("paid");
        else if (stripeStatus === "expired") setStatus("error");
        else setStatus("pending");
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-lg px-4 pb-20 pt-28 text-center">
        {status === "loading" ? <p>Confirming your ticket…</p> : null}
        {status === "paid" ? (
          <>
            <h1 className="font-display text-2xl text-gold">Ticket confirmed</h1>
            {ticketNumber != null ? (
              <p className="mt-4 font-brand text-sm tracking-[0.12em] text-gold">
                Your ticket number is #{ticketNumber}
              </p>
            ) : null}
            <p className="mt-3 text-sm text-foreground/80">Check your email for confirmation.</p>
          </>
        ) : null}
        {status === "pending" ? (
          <p className="text-sm text-foreground/80">Payment is still processing. Refresh in a moment.</p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-red-400">
            We could not confirm payment. Contact us if you were charged.
          </p>
        ) : null}
        <Link href={onComingEventHubHref()} className="mt-8 inline-block text-sm text-gold hover:underline">
          On Coming Events
        </Link>
        <Link
          href={onComingEventDetailHref(slug)}
          className="mt-4 block text-sm text-foreground/70 hover:text-gold"
        >
          Back to event
        </Link>
      </div>
      <Footer />
    </main>
  );
}

export default function FixedTicketReturnClient({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-28 text-center text-foreground/70">Loading…</main>
      }
    >
      <FixedTicketReturnInner slug={slug} />
    </Suspense>
  );
}
