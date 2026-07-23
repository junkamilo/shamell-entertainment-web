"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import {
  ClassPaymentConfirmationFallback,
  ClassPaymentConfirmationPanel,
  type ConfirmationStatus,
} from "./ClassPaymentConfirmationPanel";
import {
  fetchVenueSessionStatus,
  type VenueSessionStatus,
} from "../services/fetchVenueSessionStatus";
import { formatCatalogPriceWithSuffix } from "@/lib/formatCatalogPrice";
import {
  onComingEventDetailHref,
  onComingEventSeatsHref,
} from "@/lib/upcomingEventPublicRoutes";

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 8;

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function sessionLabelFor(reservation: VenueSessionStatus["reservation"]): string {
  if (reservation.seatDisplayLabel) {
    return reservation.seatDisplayLabel;
  }
  return reservation.kind === "catalog_table"
    ? `Table — ${reservation.tableName ?? "Reserved"}`
    : "Chair";
}

function VenueSeatReturnInner({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [reservation, setReservation] = useState<VenueSessionStatus["reservation"] | null>(
    null,
  );
  const [pollKey, setPollKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setStatus("loading");
    setPollKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS && !cancelled; attempt++) {
        const data = await fetchVenueSessionStatus(sessionId);
        if (!data) {
          if (attempt === MAX_POLL_ATTEMPTS - 1) setStatus("error");
        } else {
          setReservation(data.reservation);
          const stripeStatus = data.stripeStatus;
          const reservationStatus = data.reservation.status;
          if (stripeStatus === "complete" || reservationStatus === "PAID") {
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
  }, [sessionId, pollKey]);

  const paidSubtitle = reservation
    ? `Thank you, ${reservation.customerName}. Your table/seat is reserved for the event.`
    : "Your table/seat is reserved for the event.";

  const totalLabel = reservation
    ? formatCatalogPriceWithSuffix(
        reservation.amount,
        reservation.currency.toUpperCase(),
      )
    : null;

  const paidExtra =
    status === "paid" && reservation ? (
      <div className="mx-auto max-w-lg space-y-2 text-sm text-foreground/80">
        {reservation.eventDate ? (
          <p>
            <span className="text-foreground/60">Event date: </span>
            {formatEventDate(reservation.eventDate)}
          </p>
        ) : null}
        {totalLabel ? (
          <p>
            <span className="text-foreground/60">Subtotal: </span>
            <span className="font-semibold text-gold">{totalLabel}</span>
            <span className="text-foreground/50"> (tax included in your Stripe receipt)</span>
          </p>
        ) : null}
        {reservation.customerEmail ? (
          <p>
            <span className="text-foreground/60">Confirmation sent to </span>
            {reservation.customerEmail}
          </p>
        ) : null}
        {slug ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={onComingEventSeatsHref(slug)}
              className="rounded-xl border border-gold/30 px-4 py-2 font-brand text-xs tracking-[0.12em] text-gold uppercase transition hover:border-gold/50 hover:bg-gold/10"
            >
              View floor plan
            </Link>
            <Link
              href={onComingEventDetailHref(slug)}
              className="rounded-xl border border-gold/20 px-4 py-2 font-brand text-xs tracking-[0.12em] text-foreground/75 uppercase transition hover:border-gold/35 hover:text-gold"
            >
              Event details
            </Link>
          </div>
        ) : null}
      </div>
    ) : null;

  const sessionRows =
    status === "paid" && reservation
      ? [
          {
            sessionLabel: sessionLabelFor(reservation),
            confirmationReference: reservation.id.slice(0, 8).toUpperCase(),
          },
        ]
      : undefined;

  return (
    <main className="min-h-screen text-foreground">
      <SiteHeader />
      <ClassPaymentConfirmationPanel
        status={status}
        paidTitle="Reservation confirmed"
        paidSubtitle={paidSubtitle}
        paidEyebrow="You're on the list"
        sessionRows={sessionRows}
        paidExtra={paidExtra}
        onRefresh={status === "pending" ? handleRefresh : undefined}
        loadingMessage="Confirming your reservation…"
        pendingMessage="Payment is still processing. Refresh in a moment or check your email."
      />
      <Footer />
    </main>
  );
}

export default function VenueSeatReturnClient({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <ClassPaymentConfirmationFallback loadingMessage="Confirming your reservation…" />
          <Footer />
        </>
      }
    >
      <VenueSeatReturnInner slug={slug} />
    </Suspense>
  );
}
