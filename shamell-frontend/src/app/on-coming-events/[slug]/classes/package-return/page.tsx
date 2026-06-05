"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getPublicApiBaseUrl } from "@/app/on-coming-events/lib/apiBaseUrl";
import {
  ClassPaymentConfirmationFallback,
  ClassPaymentConfirmationPanel,
  type ConfirmationStatus,
  type SessionTicket,
} from "@/app/on-coming-events/components/ClassPaymentConfirmationPanel";

type PurchaseKind = "day_bundle" | "package" | null;

function PackageCheckoutReturnInner() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [sessionRows, setSessionRows] = useState<SessionTicket[]>([]);
  const [purchaseKind, setPurchaseKind] = useState<PurchaseKind>(null);
  const [pollCount, setPollCount] = useState(0);

  const loadStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus("error");
      return;
    }
    const base = getPublicApiBaseUrl();
    const response = await fetch(
      `${base}/api/v1/class-enrollments/session-status?session_id=${encodeURIComponent(sessionId)}`,
    );
    const data: unknown = response.ok ? await response.json().catch(() => null) : null;
    if (!data || typeof data !== "object") {
      setStatus("error");
      return;
    }
    const o = data as Record<string, unknown>;
    const kind = o.purchaseKind;
    if (kind === "day_bundle" || kind === "package") {
      setPurchaseKind(kind);
    } else if (o.package === true) {
      setPurchaseKind("package");
    }

    const enrollment =
      o.enrollment && typeof o.enrollment === "object"
        ? (o.enrollment as Record<string, unknown>)
        : null;
    const sessions = enrollment?.sessions;
    if (Array.isArray(sessions)) {
      const rows: SessionTicket[] = [];
      for (const s of sessions) {
        if (!s || typeof s !== "object") continue;
        const row = s as Record<string, unknown>;
        const sessionLabel =
          typeof row.sessionLabel === "string" ? row.sessionLabel : null;
        if (!sessionLabel) continue;
        const confirmationReference =
          typeof row.confirmationReference === "string"
            ? row.confirmationReference
            : undefined;
        rows.push({ sessionLabel, confirmationReference });
      }
      setSessionRows(rows);
    }

    const stripeStatus = o.stripeStatus;
    const enStatus = enrollment?.status;
    if (stripeStatus === "complete" || enStatus === "PAID") setStatus("paid");
    else if (stripeStatus === "expired") setStatus("error");
    else setStatus("pending");
  }, [sessionId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status !== "pending" || !sessionId) return;
    if (pollCount >= 8) return;
    const timer = window.setTimeout(() => {
      setPollCount((c) => c + 1);
      void loadStatus();
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [status, sessionId, pollCount, loadStatus]);

  const paidTitle =
    purchaseKind === "day_bundle" ? "Classes confirmed"
    : purchaseKind === "package" ? "Package confirmed"
    : "Booking confirmed";

  const paidSubtitle =
    purchaseKind === "day_bundle"
      ? "We sent one confirmation email with your class details and confirmation codes. Present it at check-in."
      : "We sent one confirmation email with all class dates and confirmation codes. Present it at check-in.";

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <ClassPaymentConfirmationPanel
        status={status}
        paidTitle={paidTitle}
        paidSubtitle={paidSubtitle}
        sessionRows={sessionRows}
        onRefresh={() => void loadStatus()}
      />
      <Footer />
    </main>
  );
}

export default function ClassPackageCheckoutReturnPage() {
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
      <PackageCheckoutReturnInner />
    </Suspense>
  );
}
