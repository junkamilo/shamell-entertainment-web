"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getPublicApiBaseUrl } from "@/app/on-coming-events/lib/apiBaseUrl";
import {
  ClassPaymentConfirmationFallback,
  ClassPaymentConfirmationPanel,
  type ConfirmationStatus,
} from "@/app/on-coming-events/components/ClassPaymentConfirmationPanel";

function ClassCheckoutReturnInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    const base = getPublicApiBaseUrl();
    fetch(
      `${base}/api/v1/class-enrollments/session-status?session_id=${encodeURIComponent(sessionId)}`,
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
        if (stripeStatus === "complete" || enStatus === "PAID") setStatus("paid");
        else if (stripeStatus === "expired") setStatus("error");
        else setStatus("pending");
      })
      .catch(() => setStatus("error"));
  }, [sessionId]);

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <ClassPaymentConfirmationPanel
        status={status}
        paidTitle="You're booked"
        paidSubtitle="We sent a confirmation email with your class details. Present it at check-in."
        loadingMessage="Confirming your booking…"
        pendingMessage="Payment is still processing. Refresh in a moment."
      />
      <Footer />
    </main>
  );
}

export default function ClassCheckoutReturnPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <ClassPaymentConfirmationFallback />
          <Footer />
        </>
      }
    >
      <ClassCheckoutReturnInner />
    </Suspense>
  );
}
