"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { StripeCheckoutHost } from "@/components/stripe/StripeCheckoutHost";
import { onComingEventHubHref } from "@/lib/upcomingEventPublicRoutes";
import {
  createClassCheckoutSession,
  type CreateClassCheckoutBody,
} from "../services/createClassCheckoutSession";
import {
  fetchUpcomingClassSessions,
  type ClassSessionPublic,
} from "../services/fetchUpcomingClassSessions";

type Props = { slug: string };

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

export default function UpcomingClassesPublicPage({ slug }: Props) {
  const [eventName, setEventName] = useState("");
  const [sessions, setSessions] = useState<ClassSessionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<ClassSessionPublic | null>(null);
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUpcomingClassSessions(slug);
      setEventName(data.event.eventTypeName);
      setSessions(data.sessions);
    } catch {
      setError("Could not load class schedule.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (mounted && checkoutSecret) {
    return (
      <StripeCheckoutHost
        layout="overlay"
        clientSecret={checkoutSecret}
        ariaLabel="Class booking payment"
      />
    );
  }

  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28 md:pt-32">
        <p className="mb-2 font-brand text-xs tracking-[0.2em] text-gold/90">ON COMING EVENTS</p>
        <h1 className="font-display text-3xl text-gold">{eventName || "Classes"}</h1>
        <p className="mt-2 text-sm text-foreground/75">Select a session and complete payment.</p>

        {loading ? <p className="mt-8 text-foreground/70">Loading schedule…</p> : null}
        {error ? <p className="mt-8 text-red-400">{error}</p> : null}

        {!loading && !error && sessions.length === 0 ? (
          <p className="mt-8 text-foreground/70">No upcoming sessions published yet.</p>
        ) : null}

        {!checkoutSecret ? (
          <ul className="mt-8 space-y-3">
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
        ) : null}

        {selectedSession && !checkoutSecret ? (
          <div className="mt-8 space-y-4 rounded-xl border border-gold/25 p-5">
            <h2 className="font-brand text-xs tracking-[0.16em] text-gold">YOUR DETAILS</h2>
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

        <p className="mt-10 text-center">
          <Link href={onComingEventHubHref()} className="text-sm text-gold hover:underline">
            All On Coming Events
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
