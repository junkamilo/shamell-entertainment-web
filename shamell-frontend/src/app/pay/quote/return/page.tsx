"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import {
  ClassPaymentConfirmationFallback,
  ClassPaymentConfirmationPanel,
  type ConfirmationStatus,
} from "@/app/on-coming-events/components/ClassPaymentConfirmationPanel";
import { formatPriceEn } from "@/lib/pricing";
import { pollCheckoutStatus } from "@/lib/checkoutReturnPolling";
import {
  fetchQuotePaymentSessionStatus,
  type QuotePaymentSessionStatus,
} from "../services/fetchQuoteCheckout";

function ReturnContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [quoteStatus, setQuoteStatus] = useState<QuotePaymentSessionStatus | null>(
    null,
  );
  const [pollKey, setPollKey] = useState(0);

  const loadStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus("error");
      setQuoteStatus(null);
      return;
    }

    setStatus("loading");
    const result = await pollCheckoutStatus({
      fetchStatus: () => fetchQuotePaymentSessionStatus(sessionId),
      isPaid: (data) =>
        data.stripeStatus === "complete" || data.paymentStatus === "PAID",
      isExpired: (data) => data.stripeStatus === "expired",
    });

    if (result.data) setQuoteStatus(result.data);

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

  const paidExtra =
    status === "paid" && quoteStatus ? (
      <div className="mx-auto max-w-lg space-y-2 text-sm text-foreground/80">
        <p>
          <span className="text-foreground/60">Amount: </span>
          <span className="font-semibold text-gold">
            {formatPriceEn(quoteStatus.amount)}
          </span>
        </p>
        {quoteStatus.customerEmail ? (
          <p>
            <span className="text-foreground/60">Confirmation sent to </span>
            {quoteStatus.customerEmail}
          </p>
        ) : null}
      </div>
    ) : null;

  const paidSubtitle =
    quoteStatus?.customerName
      ? `Thank you, ${quoteStatus.customerName}. A confirmation was sent to your email.`
      : "A confirmation was sent to your email.";

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <ClassPaymentConfirmationPanel
        status={status}
        paidTitle="Payment confirmed"
        paidSubtitle={paidSubtitle}
        paidEyebrow="Thank you"
        paidExtra={paidExtra}
        loadingMessage="Confirming your payment…"
        pendingMessage="Payment is still processing. Refresh in a moment or check your email shortly."
        errorMessage="We could not confirm payment. Contact us if you were charged."
        onRefresh={status === "pending" ? handleRefresh : undefined}
      />
      <Footer />
    </main>
  );
}

export default function PayQuoteReturnPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <ClassPaymentConfirmationFallback loadingMessage="Confirming your payment…" />
          <Footer />
        </>
      }
    >
      <ReturnContent />
    </Suspense>
  );
}
