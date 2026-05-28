"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getPublicApiBaseUrl } from "@/app/on-coming-events/lib/apiBaseUrl";
import { onComingEventHubHref } from "@/lib/upcomingEventPublicRoutes";

function ClassCheckoutReturnInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [eventSlug, setEventSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    const base = getPublicApiBaseUrl();
    fetch(`${base}/api/v1/class-enrollments/session-status?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object") {
          setStatus("error");
          return;
        }
        const o = data as Record<string, unknown>;
        const enrollment =
          o.enrollment && typeof o.enrollment === "object" ?
            (o.enrollment as Record<string, unknown>)
          : null;
        if (enrollment && typeof enrollment.eventSlug === "string") {
          setEventSlug(enrollment.eventSlug);
        }
        const stripeStatus = o.stripeStatus;
        const enStatus = enrollment?.status;
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
        {status === "loading" ? <p>Confirming your booking…</p> : null}
        {status === "paid" ? (
          <>
            <h1 className="font-display text-2xl text-gold">You&apos;re booked</h1>
            <p className="mt-3 text-sm text-foreground/80">Check your email for confirmation.</p>
          </>
        ) : null}
        {status === "pending" ? (
          <p className="text-sm text-foreground/80">Payment is still processing. Refresh in a moment.</p>
        ) : null}
        {status === "error" ? (
          <p className="text-sm text-red-400">We could not confirm payment. Contact us if you were charged.</p>
        ) : null}
        <Link href={onComingEventHubHref()} className="mt-8 inline-block text-sm text-gold hover:underline">
          On Coming Events
        </Link>
        {eventSlug ? (
          <Link
            href={`/on-coming-events/${eventSlug}/classes`}
            className="mt-4 block text-sm text-foreground/70 hover:text-gold"
          >
            Back to class schedule
          </Link>
        ) : null}
      </div>
      <Footer />
    </main>
  );
}

export default function ClassCheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen pt-28 text-center text-foreground/70">Loading…</main>
      }
    >
      <ClassCheckoutReturnInner />
    </Suspense>
  );
}
