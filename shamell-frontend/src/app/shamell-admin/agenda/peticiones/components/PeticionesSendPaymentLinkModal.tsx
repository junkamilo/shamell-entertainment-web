"use client";

import { useEffect, useState } from "react";
import AdminModal from "@/components/admin/AdminModal";
import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import { cn } from "@/lib/utils";

type PaymentModel = "FULL" | "DEPOSIT";

type Props = {
  booking: AdminBookingRow | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    paymentModel: PaymentModel;
    totalAmount: number;
    depositAmount?: number;
  }) => void;
  isSubmitting?: boolean;
};

function defaultTotal(booking: AdminBookingRow | null): string {
  if (booking?.quoteTotalAmount != null && booking.quoteTotalAmount > 0) {
    return String(booking.quoteTotalAmount);
  }
  return "2500";
}

function defaultDeposit(booking: AdminBookingRow | null): string {
  if (booking?.quoteDepositAmount != null && booking.quoteDepositAmount > 0) {
    return String(booking.quoteDepositAmount);
  }
  return "1000";
}

export default function PeticionesSendPaymentLinkModal({
  booking,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: Props) {
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentModel, setPaymentModel] = useState<PaymentModel>("FULL");
  const [depositAmount, setDepositAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !booking) return;
    setTotalAmount(defaultTotal(booking));
    setPaymentModel(booking.quoteModel === "DEPOSIT" ? "DEPOSIT" : "FULL");
    setDepositAmount(defaultDeposit(booking));
    setError(null);
  }, [booking, isOpen]);

  const handleSubmit = () => {
    const total = Number(totalAmount);
    if (!Number.isFinite(total) || total <= 0) {
      setError("Enter a valid total price in USD.");
      return;
    }

    if (paymentModel === "DEPOSIT") {
      const deposit = Number(depositAmount);
      if (!Number.isFinite(deposit) || deposit <= 0) {
        setError("Enter a valid deposit amount in USD.");
        return;
      }
      if (deposit >= total) {
        setError("Deposit must be less than the total price.");
        return;
      }
      onSubmit({ paymentModel, totalAmount: total, depositAmount: deposit });
      return;
    }

    onSubmit({ paymentModel, totalAmount: total });
  };

  const clientName =
    booking?.guestFullName?.trim() ||
    booking?.user?.fullName?.trim() ||
    "Client";

  return (
    <AdminModal title="Send payment link" isOpen={isOpen} onClose={onClose}>
      <div className="mx-auto max-w-lg space-y-5">
        <p className="font-body text-sm leading-relaxed text-foreground/75 sm:text-base">
          Set the quote for{" "}
          <span className="font-medium text-gold">{clientName}</span>. The customer will receive
          an email with a secure Stripe payment link.
        </p>

        <label className="block space-y-2">
          <span className="font-brand text-xs tracking-[0.16em] text-gold/80 uppercase">
            Total price (USD)
          </span>
          <input
            type="number"
            min={0.5}
            step="0.01"
            inputMode="decimal"
            value={totalAmount}
            onChange={(e) => {
              setTotalAmount(e.target.value);
              setError(null);
            }}
            className="w-full rounded-lg border border-gold/25 bg-shamell-surface-deep px-4 py-3 font-body text-base text-foreground outline-none transition focus:border-gold/50"
            placeholder="2500"
            autoFocus
          />
        </label>

        <fieldset className="space-y-3">
          <legend className="font-brand text-xs tracking-[0.16em] text-gold/80 uppercase">
            Payment model
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["FULL", "DEPOSIT"] as const).map((model) => {
              const selected = paymentModel === model;
              return (
                <button
                  key={model}
                  type="button"
                  onClick={() => {
                    setPaymentModel(model);
                    setError(null);
                  }}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-left transition",
                    selected
                      ? "border-gold/50 bg-gold/10 text-gold"
                      : "border-gold/20 bg-black/20 text-foreground/75 hover:border-gold/35",
                  )}
                >
                  <span className="block font-brand text-xs tracking-[0.14em] uppercase">
                    {model === "FULL" ? "Full payment" : "Deposit"}
                  </span>
                  <span className="mt-1 block font-body text-xs leading-snug text-foreground/60">
                    {model === "FULL"
                      ? "One link for the full amount."
                      : "Collect a deposit now; balance later."}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {paymentModel === "DEPOSIT" ? (
          <label className="block space-y-2">
            <span className="font-brand text-xs tracking-[0.16em] text-gold/80 uppercase">
              Deposit amount (USD)
            </span>
            <input
              type="number"
              min={0.5}
              step="0.01"
              inputMode="decimal"
              value={depositAmount}
              onChange={(e) => {
                setDepositAmount(e.target.value);
                setError(null);
              }}
              className="w-full rounded-lg border border-gold/25 bg-shamell-surface-deep px-4 py-3 font-body text-base text-foreground outline-none transition focus:border-gold/50"
              placeholder="1000"
            />
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/10 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md border border-gold/25 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-foreground/70 transition hover:border-gold/35 hover:text-gold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-md border border-sky-300/45 bg-sky-500/10 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-50"
          >
            {isSubmitting ? "Sending…" : "Send payment link"}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
