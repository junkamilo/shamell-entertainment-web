"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StripeCheckoutHost } from "@/components/stripe/StripeCheckoutHost";
import { MonthPackageIncludedSessions } from "./MonthPackageIncludedSessions";
import { createClassBundleCheckoutSession } from "../services/createClassBundleCheckoutSession";
import { createClassMonthPackageCheckoutSession } from "../services/createClassMonthPackageCheckoutSession";
import {
  createClassCheckoutSession,
  type CreateClassCheckoutBody,
} from "../services/createClassCheckoutSession";
import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";
import type { MonthPackageOffer, OnComingEventSchedule } from "../services/fetchOnComingEventDetail";
import {
  buildDaySectionOffers,
  sumSelectedOfferPrices,
} from "../lib/buildDaySectionOffers";
import {
  buildMonthPackagePreview,
  formatMonthLabel,
  isMonthPackagePurchasable,
  listMonthSessions,
} from "../lib/buildMonthPackagePreview";
import { getNextOccurrence } from "../lib/buildScheduleMonthGrid";
import { parseISOLocal, toISOLocalDate } from "@/lib/contactLogisticsUtils";

function formatSectionTime(start: string, end: string) {
  const fmt = (hhmm: string) => {
    const [hs, ms] = hhmm.split(":");
    const d = new Date();
    d.setHours(Number(hs), Number(ms), 0, 0);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatDateHeader(dateIso: string, timezone: string) {
  const d = parseISOLocal(dateIso);
  if (!d) return dateIso;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: timezone,
  });
}

function formatSessionWhen(session: ClassSessionPublic) {
  const start = new Date(session.startsAt);
  const end = new Date(session.endsAt);
  const dayLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: session.timezone,
  });
  const startTime = start.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  });
  const endTime = end.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: session.timezone,
  });
  return `${dayLabel}, ${startTime} - ${endTime}`;
}

const panelSpring = { type: "spring" as const, damping: 28, stiffness: 340, mass: 0.9 };
const stepEase = [0.22, 1, 0.36, 1] as const;

function SeatStatsGrid({
  capacity,
  seatsRemaining,
}: {
  capacity: number;
  seatsRemaining: number;
}) {
  const sold = Math.max(0, capacity - seatsRemaining);
  const stats = [
    { label: "Total", value: capacity },
    { label: "Sold", value: sold },
    { label: "Left", value: seatsRemaining },
  ];
  return (
    <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-gold/12 bg-black/35 px-2 py-2 text-center sm:px-3 sm:py-2.5"
        >
          <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-foreground/45 sm:text-[10px]">
            {stat.label}
          </p>
          <p className="mt-0.5 font-brand text-base tabular-nums text-gold sm:text-lg">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

type Step = "confirm" | "day" | "sections" | "details" | "legacySession";
type BookingKind = "day" | "month";

type Props = {
  slug: string;
  sessions: ClassSessionPublic[];
  schedule: OnComingEventSchedule | null;
  monthPackage?: MonthPackageOffer | null;
  open: boolean;
  onClose: () => void;
  entryFlow?: "day" | "month";
  initialWeekday?: number | null;
  initialDateIso?: string | null;
};

export function ClassBookingWizard({
  slug,
  sessions,
  schedule,
  monthPackage = null,
  open,
  onClose,
  entryFlow = "day",
  initialWeekday = null,
  initialDateIso = null,
}: Props) {
  const days = useMemo(
    () => (schedule?.mode === "RECURRING_WEEKLY" ? schedule.days : []),
    [schedule],
  );
  const timezone =
    schedule?.mode === "RECURRING_WEEKLY" ? schedule.timezone : "America/New_York";
  const useWizard = days.length > 0;
  const activeWeekdays = useMemo(() => days.map((d) => d.weekday), [days]);
  const hasMonthPackage =
    isMonthPackagePurchasable(monthPackage) && Boolean(monthPackage?.currentMonthIso);
  const monthPackageLabel = monthPackage?.label?.trim() || "Buy full month";

  const [step, setStep] = useState<Step>(useWizard ? "day" : "legacySession");
  const [bookingKind, setBookingKind] = useState<BookingKind>("day");
  const [selectedMonthIso, setSelectedMonthIso] = useState<string | null>(null);
  const [weekday, setWeekday] = useState<number | null>(null);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedSession, setSelectedSession] = useState<ClassSessionPublic | null>(
    null,
  );
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

  const selectedDay = days.find((d) => d.weekday === weekday) ?? null;

  const offers = useMemo(() => {
    if (selectedDateIso == null || weekday == null) return [];
    return buildDaySectionOffers({
      dateIso: selectedDateIso,
      weekday,
      sections: selectedDay?.sections ?? [],
      sessions,
      timezone,
    });
  }, [selectedDateIso, weekday, selectedDay, sessions, timezone]);

  const availableOffers = useMemo(
    () => offers.filter((o) => o.available && o.sessionId),
    [offers],
  );

  const selectedTotal = useMemo(
    () => sumSelectedOfferPrices(offers, selectedSessionIds),
    [offers, selectedSessionIds],
  );

  const monthPreview = useMemo(() => {
    if (!selectedMonthIso || !hasMonthPackage) return null;
    return buildMonthPackagePreview({
      monthIso: selectedMonthIso,
      sessions,
      timezone,
      weekdayLabels: days.map((d) => d.label),
    });
  }, [selectedMonthIso, hasMonthPackage, sessions, timezone, days]);
  const currentMonthSessions = useMemo(
    () =>
      selectedMonthIso
        ? listMonthSessions(sessions, selectedMonthIso, timezone)
        : [],
    [selectedMonthIso, sessions, timezone],
  );

  const allAvailableSelected =
    availableOffers.length > 0 &&
    availableOffers.every((o) => o.sessionId && selectedSessionIds.has(o.sessionId));

  const legacySessions = useMemo(
    () =>
      sessions
        .filter((s) => s.seatsRemaining > 0)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [sessions],
  );

  const goToSections = (wd: number, dateIso: string) => {
    setWeekday(wd);
    setSelectedDateIso(dateIso);
    setSelectedSessionIds(new Set());
    setStep("sections");
  };

  useEffect(() => {
    if (!open) return;
    setCheckoutSecret(null);
    setCheckoutError(null);
    setSelectedSession(null);
    setSelectedSessionIds(new Set());
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");

    if (entryFlow === "month" && hasMonthPackage && monthPackage?.currentMonthIso) {
      setBookingKind("month");
      setSelectedMonthIso(monthPackage.currentMonthIso);
      setWeekday(null);
      setSelectedDateIso(null);
      setStep("confirm");
      return;
    }

    setBookingKind("day");
    setSelectedMonthIso(monthPackage?.currentMonthIso ?? null);

    if (!useWizard) {
      setStep("legacySession");
      setWeekday(null);
      setSelectedDateIso(null);
      return;
    }

    const todayIso = toISOLocalDate(new Date());
    const effectiveFrom =
      schedule?.mode === "RECURRING_WEEKLY" ? schedule.effectiveFrom : null;
    const fromIso =
      effectiveFrom && effectiveFrom > todayIso ? effectiveFrom : todayIso;

    if (initialDateIso && initialWeekday != null) {
      goToSections(initialWeekday, initialDateIso);
      return;
    }

    if (initialWeekday != null && days.some((d) => d.weekday === initialWeekday)) {
      const next = getNextOccurrence([initialWeekday], fromIso);
      if (next) {
        goToSections(initialWeekday, next);
        return;
      }
    }

    setWeekday(null);
    setSelectedDateIso(null);
    setStep("day");
  }, [
    open,
    useWizard,
    hasMonthPackage,
    monthPackage,
    entryFlow,
    initialWeekday,
    initialDateIso,
    days,
    schedule,
  ]);

  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const pickDay = (wd: number) => {
    const todayIso = toISOLocalDate(new Date());
    const effectiveFrom =
      schedule?.mode === "RECURRING_WEEKLY" ? schedule.effectiveFrom : null;
    const fromIso =
      effectiveFrom && effectiveFrom > todayIso ? effectiveFrom : todayIso;
    const next = getNextOccurrence([wd], fromIso);
    if (!next) return;
    goToSections(wd, next);
  };

  const toggleSession = (sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const selectAllAvailable = () => {
    setSelectedSessionIds(
      new Set(availableOffers.map((o) => o.sessionId!).filter(Boolean)),
    );
  };

  const clearSelection = () => setSelectedSessionIds(new Set());

  const startCheckout = async () => {
    setIsSubmitting(true);
    setCheckoutError(null);

    if (step === "details" && useWizard && bookingKind === "month" && selectedMonthIso) {
      const result = await createClassMonthPackageCheckoutSession(slug, {
        monthIso: selectedMonthIso,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
      });
      setIsSubmitting(false);
      if (!result.ok) {
        setCheckoutError(result.message);
        return;
      }
      setCheckoutSecret(result.clientSecret);
      return;
    }

    if (step === "details" && useWizard && bookingKind === "day") {
      const ids = [...selectedSessionIds];
      const result = await createClassBundleCheckoutSession(slug, {
        sessionIds: ids,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
      });
      setIsSubmitting(false);
      if (!result.ok) {
        setCheckoutError(result.message);
        return;
      }
      setCheckoutSecret(result.clientSecret);
      return;
    }

    if (!selectedSession) return;
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

  const stepTitle =
    step === "confirm" ? "Confirm full month package"
    : step === "day" ? "Choose a day"
    : step === "sections" && selectedDateIso ?
      formatDateHeader(selectedDateIso, timezone)
    : step === "details" ? "Your details"
    : "Choose a session";

  const showSectionsFooter = step === "sections";

  if (!open || !mounted) return null;

  if (checkoutSecret) {
    return (
      <StripeCheckoutHost
        clientSecret={checkoutSecret}
        ariaLabel="Class booking payment"
      />
    );
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="class-booking-overlay"
          className="fixed inset-0 z-60 flex items-end justify-center bg-shamell-night/88 px-0 backdrop-blur-sm sm:items-center sm:px-4 sm:py-8"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: stepEase }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(92dvh,44rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-gold/35 bg-[linear-gradient(180deg,rgba(18,10,22,0.98),rgba(6,4,8,0.99))] shadow-[0_28px_90px_rgba(0,0,0,0.65)] sm:max-h-[min(90dvh,46rem)] sm:max-w-xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: panelSpring }}
            exit={{ opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.18 } }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gold/20 px-4 py-3.5 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="font-brand text-[11px] tracking-[0.18em] text-gold uppercase sm:text-xs sm:tracking-[0.2em]"
                >
                  {bookingKind === "month" ? monthPackageLabel : "Book a class"}
                </h2>
                <motion.p
                  key={stepTitle}
                  className="mt-1 truncate text-xs text-foreground/60 sm:text-sm"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: stepEase }}
                >
                  {stepTitle}
                </motion.p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-gold/30 text-foreground/70 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="shamell-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.24, ease: stepEase }}
                >
                  {step === "confirm" ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gold/20 bg-black/25 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">
                          Package summary
                        </p>
                        <p className="mt-1 font-brand text-sm text-gold">
                          {monthPackageLabel} — {selectedMonthIso ? formatMonthLabel(selectedMonthIso) : "Current month"}
                        </p>
                        <p className="mt-1 text-sm text-foreground/75">
                          {monthPackage?.currentMonthSessionCount ?? monthPreview?.sessionCount ?? 0} class
                          {(monthPackage?.currentMonthSessionCount ?? monthPreview?.sessionCount ?? 0) === 1 ? "" : "es"} included
                        </p>
                        <p className="mt-0.5 text-sm tabular-nums text-foreground/80">
                          Total ${monthPackage?.price?.toFixed(2) ?? "0.00"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gold/20 bg-black/20 p-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">
                          Included sessions
                        </p>
                        {currentMonthSessions.length === 0 ? (
                          <p className="mt-2 text-sm text-foreground/65">
                            No upcoming sessions available for this month.
                          </p>
                        ) : (
                          <MonthPackageIncludedSessions
                            sessions={currentMonthSessions}
                            monthIso={selectedMonthIso ?? monthPackage?.currentMonthIso ?? ""}
                            timezone={timezone}
                          />
                        )}
                      </div>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setStep("details")}
                        disabled={!selectedMonthIso || !hasMonthPackage}
                        className="min-h-12 w-full rounded-xl border border-gold/45 bg-gold/15 py-3 font-brand text-xs tracking-[0.14em] text-gold uppercase disabled:opacity-50"
                      >
                        Confirm purchase
                      </motion.button>
                    </div>
                  ) : step === "day" ? (
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {days.map((d, i) => (
                        <motion.button
                          key={d.weekday}
                          type="button"
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.04, duration: 0.22, ease: stepEase }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => pickDay(d.weekday)}
                          className={cn(
                            "min-h-11 rounded-full border px-5 py-2.5 font-brand text-xs tracking-[0.12em] transition sm:text-sm",
                            weekday === d.weekday ?
                              "border-gold bg-gold/15 text-gold shadow-[0_0_20px_rgba(212,175,55,0.12)]"
                            : "border-gold/30 text-foreground/80 hover:border-gold/50",
                          )}
                        >
                          {d.label}
                        </motion.button>
                      ))}
                    </div>
                  ) : step === "sections" ? (
                    <>
                      {selectedDay ? (
                        <p className="mb-4 text-[11px] uppercase tracking-[0.12em] text-foreground/50 sm:text-xs">
                          {selectedDay.label} · {offers.length} section
                          {offers.length === 1 ? "" : "s"}
                        </p>
                      ) : null}
                      {offers.length === 0 ? (
                        <p className="rounded-xl border border-gold/15 bg-black/25 px-4 py-6 text-center text-sm text-foreground/70">
                          No class sections are scheduled for this date.
                        </p>
                      ) : (
                        <ul className="space-y-3 sm:space-y-3.5">
                          {offers.map((offer, index) => {
                            const selected =
                              offer.sessionId != null &&
                              selectedSessionIds.has(offer.sessionId);
                            return (
                              <motion.li
                                key={`${offer.sectionId}-${offer.sortOrder}`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.06,
                                  duration: 0.28,
                                  ease: stepEase,
                                }}
                                layout
                              >
                                <motion.button
                                  type="button"
                                  layout
                                  disabled={!offer.available}
                                  whileTap={offer.available ? { scale: 0.985 } : undefined}
                                  onClick={() =>
                                    offer.sessionId && toggleSession(offer.sessionId)
                                  }
                                  className={cn(
                                    "w-full rounded-2xl border px-4 py-4 text-left transition sm:px-5 sm:py-5",
                                    "disabled:cursor-not-allowed disabled:opacity-55",
                                    selected ?
                                      "border-gold/70 bg-gold/10 shadow-[inset_0_0_0_1px_rgba(212,175,55,0.25)]"
                                    : "border-gold/22 bg-black/20 hover:border-gold/40 hover:bg-black/30",
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p className="font-brand text-sm leading-snug text-gold sm:text-base">
                                          {offer.label}
                                        </p>
                                        {offer.price != null && offer.available ? (
                                          <span className="shrink-0 rounded-full border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-xs font-medium tabular-nums text-foreground/90 sm:text-sm">
                                            ${offer.price.toFixed(2)}
                                          </span>
                                        ) : null}
                                      </div>
                                      <p className="mt-1.5 text-sm text-foreground/75">
                                        {formatSectionTime(offer.startTime, offer.endTime)}
                                      </p>
                                    </div>
                                    {offer.available ? (
                                      <motion.span
                                        aria-hidden
                                        className={cn(
                                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                          selected ?
                                            "border-gold bg-gold text-black"
                                          : "border-gold/35 bg-transparent",
                                        )}
                                        animate={
                                          selected ?
                                            { scale: [1, 1.12, 1] }
                                          : { scale: 1 }
                                        }
                                        transition={{ duration: 0.2 }}
                                      >
                                        {selected ? (
                                          <Check className="h-4 w-4" strokeWidth={3} />
                                        ) : null}
                                      </motion.span>
                                    ) : null}
                                  </div>
                                  {offer.sessionId != null && offer.capacity > 0 ? (
                                    <SeatStatsGrid
                                      capacity={offer.capacity}
                                      seatsRemaining={offer.seatsRemaining}
                                    />
                                  ) : offer.available && offer.price != null ? null : (
                                    <p className="mt-3 text-xs text-foreground/50">
                                      Not available on this date
                                    </p>
                                  )}
                                </motion.button>
                              </motion.li>
                            );
                          })}
                        </ul>
                      )}
                      {!initialDateIso && activeWeekdays.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setStep("day")}
                          className="mt-5 min-h-10 text-xs text-foreground/50 transition hover:text-gold"
                        >
                          ← Change day
                        </button>
                      ) : null}
                    </>
                  ) : step === "details" ? (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-gold/20 bg-black/25 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.12em] text-foreground/50">
                          Order summary
                        </p>
                        {bookingKind === "month" && selectedMonthIso ? (
                          <>
                            <p className="mt-1 font-brand text-sm text-gold">
                              {monthPackageLabel} — {formatMonthLabel(selectedMonthIso)}
                            </p>
                            <p className="mt-0.5 text-sm text-foreground/75">
                              {monthPreview?.sessionCount ?? 0} class
                              {(monthPreview?.sessionCount ?? 0) === 1 ? "" : "es"} included
                            </p>
                            <p className="mt-0.5 text-sm tabular-nums text-foreground/80">
                              Total ${monthPackage?.price?.toFixed(2) ?? "0.00"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 font-brand text-sm text-gold">
                              {selectedSessionIds.size} class
                              {selectedSessionIds.size === 1 ? "" : "es"} selected
                            </p>
                            <p className="mt-0.5 text-sm tabular-nums text-foreground/80">
                              Total ${selectedTotal.toFixed(2)}
                            </p>
                          </>
                        )}
                      </div>
                      <input
                        className="min-h-11 w-full rounded-xl border border-gold/30 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-gold/55 focus:ring-1 focus:ring-gold/25"
                        placeholder="Full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                      <input
                        className="min-h-11 w-full rounded-xl border border-gold/30 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-gold/55 focus:ring-1 focus:ring-gold/25"
                        placeholder="Email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                      <input
                        className="min-h-11 w-full rounded-xl border border-gold/30 bg-black/30 px-3 py-2.5 text-sm outline-none transition focus:border-gold/55 focus:ring-1 focus:ring-gold/25"
                        placeholder="Phone (optional)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                      {checkoutError ? (
                        <p className="text-sm text-red-400">{checkoutError}</p>
                      ) : null}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        disabled={
                          isSubmitting || !customerName.trim() || !customerEmail.trim()
                        }
                        onClick={() => void startCheckout()}
                        className="min-h-12 w-full rounded-xl border border-gold/45 bg-gold/15 py-3 font-brand text-xs tracking-[0.14em] text-gold uppercase disabled:opacity-50"
                      >
                        {isSubmitting ? "Starting checkout…" : "Continue to payment"}
                      </motion.button>
                      <button
                        type="button"
                        onClick={() =>
                          setStep(bookingKind === "month" ? "confirm" : "sections")
                        }
                        className="min-h-10 text-xs text-foreground/50 transition hover:text-gold"
                      >
                        {bookingKind === "month" ? "← Back to package" : "← Back to sections"}
                      </button>
                    </div>
                  ) : step === "legacySession" ? (
                    <>
                      {legacySessions.length === 0 ? (
                        <p className="rounded-xl border border-gold/15 bg-black/25 px-4 py-6 text-center text-sm text-foreground/70">
                          No upcoming sessions available.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {legacySessions.map((session, index) => {
                            const selected = selectedSession?.id === session.id;
                            return (
                              <motion.li
                                key={session.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: index * 0.05,
                                  duration: 0.24,
                                  ease: stepEase,
                                }}
                              >
                                <motion.button
                                  type="button"
                                  whileTap={{ scale: 0.985 }}
                                  onClick={() => setSelectedSession(session)}
                                  className={cn(
                                    "w-full rounded-2xl border px-4 py-4 text-left sm:px-5 sm:py-5",
                                    selected ?
                                      "border-gold/70 bg-gold/10"
                                    : "border-gold/22 bg-black/20 hover:border-gold/40",
                                  )}
                                >
                                  <p className="font-brand text-sm text-gold sm:text-base">
                                    {formatSessionWhen(session)}
                                  </p>
                                  <p className="mt-2 text-sm font-medium tabular-nums text-foreground/85">
                                    ${session.price.toFixed(2)}
                                  </p>
                                  <SeatStatsGrid
                                    capacity={session.capacity}
                                    seatsRemaining={session.seatsRemaining}
                                  />
                                </motion.button>
                              </motion.li>
                            );
                          })}
                        </ul>
                      )}
                      {selectedSession ? (
                        <div className="mt-6 space-y-4 rounded-2xl border border-gold/25 bg-black/20 p-4 sm:p-5">
                          <h3 className="font-brand text-xs tracking-[0.14em] text-gold uppercase">
                            Your details
                          </h3>
                          <input
                            className="min-h-11 w-full rounded-xl border border-gold/30 bg-black/30 px-3 py-2.5 text-sm"
                            placeholder="Full name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                          />
                          <input
                            className="min-h-11 w-full rounded-xl border border-gold/30 bg-black/30 px-3 py-2.5 text-sm"
                            placeholder="Email"
                            type="email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                          />
                          <input
                            className="min-h-11 w-full rounded-xl border border-gold/30 bg-black/30 px-3 py-2.5 text-sm"
                            placeholder="Phone (optional)"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                          />
                          {checkoutError ? (
                            <p className="text-sm text-red-400">{checkoutError}</p>
                          ) : null}
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            disabled={
                              isSubmitting ||
                              !customerName.trim() ||
                              !customerEmail.trim()
                            }
                            onClick={() => void startCheckout()}
                            className="min-h-12 w-full rounded-xl border border-gold/45 bg-gold/15 py-3 font-brand text-xs tracking-[0.14em] text-gold uppercase disabled:opacity-50"
                          >
                            {isSubmitting ? "Starting checkout…" : "Continue to payment"}
                          </motion.button>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {showSectionsFooter ? (
                <motion.div
                  key="sections-footer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.22, ease: stepEase }}
                  className="shrink-0 border-t border-gold/20 bg-[#0a0908]/95 px-4 py-4 backdrop-blur-md sm:px-5 pb-[max(1rem,env(safe-area-inset-bottom))]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-foreground/85">
                      <input
                        type="checkbox"
                        checked={allAvailableSelected}
                        onChange={() =>
                          allAvailableSelected ? clearSelection() : selectAllAvailable()
                        }
                        disabled={availableOffers.length === 0}
                        className="h-4 w-4 accent-gold"
                      />
                      Select all
                    </label>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-foreground/45">
                        Total
                      </p>
                      <motion.p
                        key={selectedTotal}
                        className="font-brand text-lg tabular-nums text-gold sm:text-xl"
                        initial={{ opacity: 0.6, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ${selectedTotal.toFixed(2)}
                      </motion.p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileTap={{ scale: selectedSessionIds.size > 0 ? 0.98 : 1 }}
                    disabled={selectedSessionIds.size === 0}
                    onClick={() => setStep("details")}
                    className="mt-4 min-h-12 w-full rounded-xl border border-gold/45 bg-gold/15 py-3.5 font-brand text-xs tracking-[0.16em] text-gold uppercase shadow-[0_8px_28px_rgba(0,0,0,0.35)] disabled:opacity-45 sm:text-sm"
                  >
                    Buy
                  </motion.button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/** Weekday index 0–6 from YYYY-MM-DD in local parse. */
export function weekdayFromIsoDate(iso: string): number | null {
  const d = parseISOLocal(iso);
  return d ? d.getDay() : null;
}
