"use client";

import { useCallback, useState } from "react";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { TABLE_SIZE_LABELS } from "@/components/floor-layout/layoutTypes";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { formatPriceEn } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { createAdminVenueCashReservation } from "../services/createAdminVenueCashReservation";
import { createAdminVenueCheckoutSession } from "../services/createAdminVenueCheckoutSession";

type PaymentMethod = "stripe" | "cash";

type Props = {
  item: PlacedLayoutItem;
  tableBundlePrice: number | null;
  eventDateIso: string | null;
  upcomingEventSlug: string | null;
  onClose: () => void;
  onReserved: (layoutItemId: string, customerName: string) => void;
};

function formatEventDate(iso: string | null): string {
  if (!iso) return "Date to be announced";
  try {
    return new Date(iso).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default function AdminVenueReservationModal({
  item,
  tableBundlePrice,
  eventDateIso,
  upcomingEventSlug,
  onClose,
  onReserved,
}: Props) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isTable = item.kind === "catalog_table";
  const title = isTable ? TABLE_SIZE_LABELS[item.size] : "Standalone chair";
  const price = isTable ? tableBundlePrice : (item.unitPrice ?? null);

  const submit = useCallback(async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Name and email are required.");
      return;
    }
    if (paymentMethod === "cash" && !cashConfirmed) {
      setError("Confirm that cash payment was received.");
      return;
    }

    const token = getAdminBearerToken();
    if (!token) {
      setError("Not signed in.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const body = {
      kind: isTable ? ("catalog_table" as const) : ("standalone_chair" as const),
      layoutItemId: item.id,
      venueTableConfigId: isTable ? item.venueTableConfigId : undefined,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      ...(upcomingEventSlug ? { upcomingEventSlug } : {}),
    };

    if (paymentMethod === "stripe") {
      const result = await createAdminVenueCheckoutSession(token, body);
      setSubmitting(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast({
        title: "Payment link sent",
        description: `A secure payment email was sent to ${customerEmail.trim()}.`,
      });
      onClose();
      return;
    }

    const result = await createAdminVenueCashReservation(token, body);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    toast({ title: "Reservation confirmed", description: result.message });
    onReserved(result.layoutItemId, result.customerName);
    onClose();
  }, [
    cashConfirmed,
    customerEmail,
    customerName,
    customerPhone,
    isTable,
    item,
    onClose,
    onReserved,
    paymentMethod,
    upcomingEventSlug,
  ]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-venue-reservation-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[min(92dvh,44rem)] w-full max-w-md overflow-y-auto rounded-t-2xl border border-shamell-gold/30 bg-shamell-twilight p-5 shadow-2xl sm:rounded-2xl">
        <h2
          id="admin-venue-reservation-title"
          className="font-brand text-lg tracking-[0.06em] text-shamell-gold"
        >
          Reserve {title}
        </h2>
        <p className="mt-1 text-xs text-shamell-text-primary/65">
          Admin reservation · {formatEventDate(eventDateIso)}
        </p>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4 border-b border-shamell-line-soft pb-2">
            <dt className="text-shamell-text-primary/60">Amount</dt>
            <dd className="font-semibold text-shamell-gold">
              {price != null ? formatPriceEn(price) : "—"}
            </dd>
          </div>
        </dl>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="block text-xs text-shamell-text-primary/70">
            Full name
            <input
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-shamell-line-soft bg-black/30 px-3 py-2 text-sm"
              autoComplete="name"
            />
          </label>
          <label className="block text-xs text-shamell-text-primary/70">
            Email
            <input
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-shamell-line-soft bg-black/30 px-3 py-2 text-sm"
              autoComplete="email"
            />
          </label>
          <label className="block text-xs text-shamell-text-primary/70">
            Phone (optional)
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-shamell-line-soft bg-black/30 px-3 py-2 text-sm"
              autoComplete="tel"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-xs text-shamell-text-primary/70">Payment method</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
              />
              Stripe (email payment link to guest)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "cash"}
                onChange={() => setPaymentMethod("cash")}
              />
              Cash (reserve immediately)
            </label>
          </fieldset>

          {paymentMethod === "cash" ? (
            <label className="flex items-start gap-2 text-xs text-shamell-text-primary/75">
              <input
                type="checkbox"
                checked={cashConfirmed}
                onChange={(e) => setCashConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              I confirm cash payment was received from the guest.
            </label>
          ) : null}

          {error ? <p className="text-xs text-shamell-danger">{error}</p> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-shamell-gold px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-black disabled:opacity-60"
            >
              {submitting
                ? "Processing…"
                : paymentMethod === "cash"
                  ? "Confirm cash reservation"
                  : "Send payment link"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-shamell-line-soft px-4 py-2.5 text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
