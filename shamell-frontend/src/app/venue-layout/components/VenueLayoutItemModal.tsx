"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { TABLE_SIZE_LABELS } from "@/components/floor-layout/layoutTypes";
import type { VenueTableConfig } from "@/app/shamell-admin/venue-tables/types/venueTables.types";
import type { StandaloneChairConfig } from "@/app/shamell-admin/venue-tables/types/standaloneChairs.types";
import { formatPriceEn } from "@/lib/pricing";
import { createVenueCheckoutSession } from "../services/createVenueCheckoutSession";

const VenueLayoutCheckoutStep = dynamic(() => import("./VenueLayoutCheckoutStep"), {
  ssr: false,
});

type Props = {
  item: PlacedLayoutItem;
  tableConfig: VenueTableConfig | null;
  standaloneChairs: StandaloneChairConfig;
  eventLabel: string | null;
  eventDateIso: string | null;
  isReserved: boolean;
  reservationsOpen: boolean;
  reservationsClosedMessage?: string;
  onClose: () => void;
};

type Step = "summary" | "details" | "payment";

function formatEventDisplay(label: string | null, eventDateIso: string | null): string {
  if (label?.trim()) return label.trim();
  if (!eventDateIso) return "Date to be announced";
  try {
    return new Date(eventDateIso).toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return eventDateIso;
  }
}

export default function VenueLayoutItemModal({
  item,
  tableConfig,
  standaloneChairs,
  eventLabel,
  eventDateIso,
  isReserved,
  reservationsOpen,
  reservationsClosedMessage = "Reservations closed",
  onClose,
}: Props) {
  const [step, setStep] = useState<Step>("summary");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  const exitPayment = useCallback(() => {
    setStep("details");
    setClientSecret(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (step === "payment") {
        exitPayment();
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step, exitPayment]);

  useEffect(() => {
    if (step !== "payment") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [step]);

  const isTable = item.kind === "catalog_table";
  const title = isTable ? TABLE_SIZE_LABELS[item.size] : "Standalone chair";
  const price = isTable ? tableConfig?.bundlePrice ?? null : standaloneChairs.unitPrice;
  const eventDisplay = formatEventDisplay(eventLabel, eventDateIso);

  const startCheckout = useCallback(async () => {
    if (!reservationsOpen) {
      setCheckoutError(reservationsClosedMessage);
      return;
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setCheckoutError("Name and email are required.");
      return;
    }

    setIsStartingCheckout(true);
    setCheckoutError(null);

    const result = await createVenueCheckoutSession({
      kind: isTable ? "catalog_table" : "standalone_chair",
      layoutItemId: item.id,
      venueTableConfigId: isTable ? item.venueTableConfigId : undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
    });

    setIsStartingCheckout(false);

    if (!result.ok) {
      setCheckoutError(result.message);
      return;
    }

    setClientSecret(result.clientSecret);
    setStep("payment");
  }, [
    reservationsOpen,
    reservationsClosedMessage,
    customerName,
    customerEmail,
    customerPhone,
    isTable,
    item,
  ]);

  if (!isReserved && step === "payment" && clientSecret) {
    return (
      <div
        className="fixed inset-0 z-120 flex items-center justify-center bg-black/80 p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Secure payment"
      >
        <button
          type="button"
          className="absolute inset-0"
          aria-label="Close payment"
          onClick={onClose}
        />
        <div className="relative z-10 flex h-[min(92dvh,860px)] w-full max-w-[min(100vw-1rem,1120px)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
          <div className="absolute right-2 top-2 z-20">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/90 p-2 text-neutral-500 shadow-sm transition hover:bg-neutral-100 hover:text-neutral-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 py-0">
            <VenueLayoutCheckoutStep clientSecret={clientSecret} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-item-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gold/25 bg-[linear-gradient(180deg,#1a1018,#0f0a12)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl">
        <h2 id="venue-item-modal-title" className="font-display text-2xl text-gold">
          {title}
        </h2>

        {isReserved ? (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-950/30 px-3 py-2 text-sm text-amber-100">
            This seat is already reserved for the event.
          </p>
        ) : null}

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
            <dt className="text-foreground/60">Event</dt>
            <dd className="text-right font-medium text-foreground">{eventDisplay}</dd>
          </div>
          {isTable ? (
            <>
              <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                <dt className="text-foreground/60">Size</dt>
                <dd className="font-medium text-foreground">{TABLE_SIZE_LABELS[item.size]}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
                <dt className="text-foreground/60">Chairs included</dt>
                <dd className="font-medium text-foreground">{item.includedChairs}</dd>
              </div>
            </>
          ) : (
            <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
              <dt className="text-foreground/60">Type</dt>
              <dd className="font-medium text-foreground">Individual seat</dd>
            </div>
          )}
          <div className="flex justify-between gap-4 border-b border-white/8 pb-2">
            <dt className="text-foreground/60">Total</dt>
            <dd className="font-semibold text-gold">{formatPriceEn(price)}</dd>
          </div>
        </dl>

        {!isReserved && step === "details" ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void startCheckout();
            }}
          >
            <label className="block text-xs text-foreground/70">
              Full name
              <input
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm"
                autoComplete="name"
              />
            </label>
            <label className="block text-xs text-foreground/70">
              Email
              <input
                type="email"
                required
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm"
                autoComplete="email"
              />
            </label>
            <label className="block text-xs text-foreground/70">
              Phone (optional)
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm"
                autoComplete="tel"
              />
            </label>
            {checkoutError ? (
              <p className="text-xs text-red-300">{checkoutError}</p>
            ) : null}
            <button
              type="submit"
              disabled={isStartingCheckout}
              className="w-full rounded-lg bg-gold py-2.5 text-xs font-semibold uppercase tracking-wider text-black hover:bg-gold-light disabled:opacity-60"
            >
              {isStartingCheckout ? "Starting…" : "Continue to payment"}
            </button>
          </form>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {!isReserved && step === "summary" ? (
            <button
              type="button"
              disabled={!reservationsOpen}
              onClick={() => setStep("details")}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-gold px-4 py-2.5 text-center font-brand text-xs font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reservationsOpen ? "Apartar" : "Reservations closed"}
            </button>
          ) : null}
          {step === "details" ? (
            <button
              type="button"
              onClick={() => setStep("summary")}
              className="rounded-lg border border-gold/30 px-4 py-2.5 text-xs uppercase tracking-wider text-foreground/80 hover:bg-white/5"
            >
              Back
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gold/30 px-4 py-2.5 text-xs uppercase tracking-wider text-foreground/80 hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
