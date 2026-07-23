"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getPublicApiBaseUrl } from "@/features/on-coming-events/lib/apiBaseUrl";
import {
  ClassPaymentConfirmationFallback,
  ClassPaymentConfirmationPanel,
  type ConfirmationStatus,
} from "@/features/on-coming-events/components/ClassPaymentConfirmationPanel";
import { pollCheckoutStatus } from "@/lib/checkoutReturnPolling";

type ClassSessionStatus = {
  stripeStatus?: string;
  enrollment?: { status?: string };
};

async function fetchClassSessionStatus(
  sessionId: string,
): Promise<ClassSessionStatus | null> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/class-enrollments/session-status?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  return (await response.json()) as ClassSessionStatus;
}

function PayClassReturnInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [pollKey, setPollKey] = useState(0);

  const loadStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    const result = await pollCheckoutStatus({
      fetchStatus: () => fetchClassSessionStatus(sessionId),
      isPaid: (data) =>
        data.stripeStatus === "complete" || data.enrollment?.status === "PAID",
      isExpired: (data) => data.stripeStatus === "expired",
    });

    if (result.outcome === "paid") setStatus("paid");
    else if (result.outcome === "expired") setStatus("error");
    else if (result.outcome === "pending") setStatus("pending");
    else setStatus("error");
  }, [sessionId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, pollKey]);

  const handleRefresh = useCallback(() => {
    setPollKey((k) => k + 1);
  }, []);

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <ClassPaymentConfirmationPanel
        status={status}
        paidTitle="You're booked"
        paidSubtitle="We sent a confirmation email with your class details. Present it at check-in."
        loadingMessage="Confirming your booking…"
        pendingMessage="Payment is still processing. Refresh in a moment."
        onRefresh={status === "pending" ? handleRefresh : undefined}
      />
      <Footer />
    </main>
  );
}

export default function PayClassReturnPage() {
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
      <PayClassReturnInner />
    </Suspense>
  );
}
