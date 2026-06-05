"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { StripeEmbeddedCheckoutOverlay } from "./StripeEmbeddedCheckoutOverlay";
import {
  createClassCheckoutSession,
  type CreateClassCheckoutBody,
} from "../services/createClassCheckoutSession";
import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";

function formatSessionWhen(session: ClassSessionPublic) {
  const start = new Date(session.startsAt);
  return start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  });
}

type Props = {
  slug: string;
  sessions: ClassSessionPublic[];
  open: boolean;
  onClose: () => void;
};

export function OnComingEventClassBookingModal({ slug, sessions, open, onClose }: Props) {
  const [selectedSession, setSelectedSession] = useState<ClassSessionPublic | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkoutSecret, setCheckoutSecret] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  const resetAndClose = () => {
    setSelectedSession(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCheckoutSecret(null);
    setCheckoutError(null);
    onClose();
  };

  const startCheckout = async () => {
    if (!selectedSession) return;
    setIsSubmitting(true);
    setCheckoutError(null);
    const body: CreateClassCheckoutBody = {
      sessionId: selectedSession.id,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
    };
    const result = await createClassCheckoutSession(slug, body);
    setIsSubmitting(false);
    if (!result.ok) {
      setCheckoutError(result.message);
      return;
    }
    setCheckoutSecret(result.clientSecret);
  };

  if (checkoutSecret) {
    return createPortal(
      <StripeEmbeddedCheckoutOverlay
        clientSecret={checkoutSecret}
        onClose={() => setCheckoutSecret(null)}
        ariaLabel="Class booking payment"
        closeOnBackdropClick={false}
      />,
      document.body,
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close booking"
        onClick={resetAndClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gold/30 bg-[#0a0908] shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gold/20 px-4 py-3">
          <h2 className="font-brand text-xs tracking-[0.16em] text-gold">BOOK A SESSION</h2>
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
          {sessions.length === 0 ? (
            <p className="text-sm text-foreground/70">No upcoming sessions available.</p>
          ) : (
            <ul className="space-y-3">
              {sessions.map((session) => {
                const selected = selectedSession?.id === session.id;
                const disabled = session.seatsRemaining <= 0;
                return (
                  <li key={session.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedSession(session)}
                      className={`w-full rounded-xl border px-4 py-4 text-left transition ${
                        selected ? "border-gold bg-gold/10" : "border-gold/25 hover:border-gold/45"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <p className="font-brand text-sm text-gold">{formatSessionWhen(session)}</p>
                      <p className="mt-1 text-sm text-foreground/80">
                        ${session.price.toFixed(2)} · {session.seatsRemaining} spot
                        {session.seatsRemaining === 1 ? "" : "s"} left
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selectedSession ? (
            <div className="mt-6 space-y-4 rounded-xl border border-gold/25 p-4">
              <h3 className="font-brand text-xs tracking-[0.14em] text-gold">YOUR DETAILS</h3>
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
