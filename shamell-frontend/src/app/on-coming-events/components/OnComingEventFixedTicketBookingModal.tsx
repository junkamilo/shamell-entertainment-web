"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { StripeCheckoutHost } from "@/components/stripe/StripeCheckoutHost";
import {
  createFixedEventCheckoutSession,
  type CreateFixedEventCheckoutBody,
} from "../services/createFixedEventCheckoutSession";

type Props = {
  slug: string;
  eventName: string;
  price: number | null;
  open: boolean;
  onClose: () => void;
};

export function OnComingEventFixedTicketBookingModal({
  slug,
  eventName,
  price,
  open,
  onClose,
}: Props) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetAndClose = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCheckoutSecret(null);
    setCheckoutError(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const startCheckout = async () => {
    setIsSubmitting(true);
    setCheckoutError(null);
    const body: CreateFixedEventCheckoutBody = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
    };
    const result = await createFixedEventCheckoutSession(slug, body);
    setIsSubmitting(false);
    if (!result.ok) {
      setCheckoutError(result.message);
      return;
    }
    setCheckoutSecret(result.clientSecret);
  };

  if (checkoutSecret) {
    return (
      <StripeCheckoutHost
        clientSecret={checkoutSecret}
        ariaLabel="Buy ticket payment"
      />
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-120 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fixed-ticket-booking-title"
    >
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-[2px]"
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gold/30 bg-[#0a0908] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
          <h2
            id="fixed-ticket-booking-title"
            className="font-brand text-xs tracking-[0.16em] text-gold"
          >
            BUY TICKET
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="rounded-lg p-2 text-foreground/70 hover:bg-gold/10 hover:text-gold"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-4 pb-safe">
          <div className="space-y-4">
            <p className="text-sm text-foreground/80">
              {eventName}
              {price != null ? (
                <span className="mt-1 block font-brand text-gold">${price.toFixed(2)}</span>
              ) : null}
            </p>
            <input
              className="w-full rounded-lg border border-gold/30 bg-black/30 px-3 py-2 text-sm"
              placeholder="Full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-gold/30 bg-black/30 px-3 py-2 text-sm"
              placeholder="Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
            <input
              className="w-full rounded-lg border border-gold/30 bg-black/30 px-3 py-2 text-sm"
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            {checkoutError ? <p className="text-sm text-red-400">{checkoutError}</p> : null}
            <button
              type="button"
              disabled={isSubmitting || !customerName.trim() || !customerEmail.trim()}
              onClick={() => void startCheckout()}
              className="w-full rounded-xl border border-gold/40 bg-gold/15 py-3 font-brand text-xs tracking-[0.14em] text-gold uppercase disabled:opacity-50"
            >
              {isSubmitting ? "Starting checkout…" : "Continue to payment"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
