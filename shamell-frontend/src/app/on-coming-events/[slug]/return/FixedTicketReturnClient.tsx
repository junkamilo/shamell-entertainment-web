"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getPublicApiBaseUrl } from "@/app/on-coming-events/lib/apiBaseUrl";
import { onComingEventDetailHref } from "@/lib/upcomingEventPublicRoutes";
import {
  ClassPaymentConfirmationFallback,
  ClassPaymentConfirmationPanel,
  type ConfirmationStatus,
} from "@/app/on-coming-events/components/ClassPaymentConfirmationPanel";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 8;

type SessionStatusResponse = {
  stripeStatus?: string;
  enrollment?: {
    status?: string;
    ticketNumber?: number;
    customerEmail?: string;
    eventName?: string;
    eventSlug?: string | null;
  };
};

async function fetchSessionStatus(
  base: string,
  sessionId: string,
): Promise<SessionStatusResponse | null> {
  const response = await fetch(
    `${base}/api/v1/fixed-event-enrollments/session-status?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  return (await response.json()) as SessionStatusResponse;
}

function FixedTicketReturnInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    const base = getPublicApiBaseUrl();

    const poll = async () => {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS && !cancelled; attempt++) {
        const data = await fetchSessionStatus(base, sessionId);
        if (!data) {
          if (attempt === MAX_POLL_ATTEMPTS - 1) setStatus("error");
        } else {
          const enrollment = data.enrollment;
          if (typeof enrollment?.ticketNumber === "number") {
            setTicketNumber(enrollment.ticketNumber);
          }
          const stripeStatus = data.stripeStatus;
          const enStatus = enrollment?.status;
          if (stripeStatus === "complete" || enStatus === "PAID") {
            setStatus("paid");
            return;
          }
          if (stripeStatus === "expired") {
            setStatus("error");
            return;
          }
          if (attempt < MAX_POLL_ATTEMPTS - 1) {
            await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
          } else {
            setStatus("pending");
          }
        }
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const ticketExtra =
    status === "paid" ? (
      <div className="space-y-3">
        {ticketNumber != null ? (
          <p className="font-brand text-sm tracking-[0.12em] text-gold">
            Your ticket number is #{ticketNumber}
          </p>
        ) : null}
        {slug ? (
          <Link
            href={onComingEventDetailHref(slug)}
            className="inline-block rounded-xl border border-gold/30 px-4 py-2 font-brand text-xs tracking-[0.12em] text-gold uppercase transition hover:border-gold/50 hover:bg-gold/10"
          >
            Event details
          </Link>
        ) : null}
      </div>
    ) : null;

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <ClassPaymentConfirmationPanel
        status={status}
        paidTitle="Ticket confirmed"
        paidSubtitle="Check your email for confirmation and entry details."
        paidExtra={ticketExtra}
        loadingMessage="Confirming your ticket…"
        pendingMessage="Payment is still processing. Refresh in a moment or check your email shortly."
      />
      <Footer />
    </main>
  );
}

export default function FixedTicketReturnClient({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <ClassPaymentConfirmationFallback loadingMessage="Confirming your ticket…" />
          <Footer />
        </>
      }
    >
      <FixedTicketReturnInner slug={slug} />
    </Suspense>
  );
}
