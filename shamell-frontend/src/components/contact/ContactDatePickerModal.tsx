"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseISOLocal,
  startOfTodayLocal,
  toISOLocalDate,
} from "@/components/contact/contactLogisticsUtils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthHasSelectableDays(year: number, month0: number, min: Date): boolean {
  const dim = new Date(year, month0 + 1, 0).getDate();
  return new Date(year, month0, dim) >= min;
}

function cellIso(viewYear: number, viewMonth0: number, day: number): string {
  return `${viewYear}-${String(viewMonth0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** One consistent label for blocked-day tooltips (avoids duplicating «Motivo:»). */
function formatBlockedDayMotivo(body: string): string {
  const t = body.trim();
  if (!t) return "Motivo:";
  if (/^motivo\s*:/i.test(t)) return t;
  return `Motivo: ${t}`;
}

type Props = {
  isOpen: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onConfirm: (iso: string) => void;
  /** ISO dates (YYYY-MM-DD) not bookable — typically from `/availability/public`. */
  blockedIsoDates?: Set<string>;
  /** Optional explanations keyed by ISO (hover desktop / tap mobile). */
  blockedReasonByIso?: Map<string, string>;
  /** When date is blocked but no entry exists in `blockedReasonByIso`. */
  blockedFallbackReason?: string;
  /** Earliest selectable calendar day (YYYY-MM-DD). Overrides browser-local “today” when set. */
  minSelectableIso?: string;
};

export default function ContactDatePickerModal({
  isOpen,
  title,
  value,
  onClose,
  onConfirm,
  blockedIsoDates,
  blockedReasonByIso,
  blockedFallbackReason = "Esta fecha no está disponible para reservas.",
  minSelectableIso,
}: Props) {
  const minDate = useMemo(() => {
    if (minSelectableIso) {
      const p = parseISOLocal(minSelectableIso);
      if (p) return p;
    }
    return startOfTodayLocal();
  }, [minSelectableIso]);

  const [viewYear, setViewYear] = useState(() => minDate.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(() => minDate.getMonth());
  const [picked, setPicked] = useState<Date | null>(null);
  /** Tap-to-show tooltip on mobile for blocked-by-policy dates */
  const [openTooltipIso, setOpenTooltipIso] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const initial = value ? parseISOLocal(value) : null;
    const validInitial = initial && initial >= minDate ? initial : minDate;
    setPicked(validInitial);
    setViewYear(validInitial.getFullYear());
    setViewMonth0(validInitial.getMonth());
    setOpenTooltipIso(null);
  }, [isOpen, value, minDate]);

  useEffect(() => {
    if (!isOpen) setOpenTooltipIso(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || openTooltipIso === null) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t?.closest?.("[data-calendar-blocked-tip-anchor]")) {
        setOpenTooltipIso(null);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen, openTooltipIso]);

  if (!isOpen) return null;

  const first = new Date(viewYear, viewMonth0, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth0 + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isAvailabilityBlocked = (day: number) => {
    const iso = cellIso(viewYear, viewMonth0, day);
    return Boolean(blockedIsoDates?.has(iso));
  };

  const isPastOrBeforeMin = (day: number) => {
    const dt = new Date(viewYear, viewMonth0, day);
    return dt < minDate;
  };

  const isDisabledDay = (day: number) => isPastOrBeforeMin(day) || isAvailabilityBlocked(day);

  const blockedReasonFor = (day: number): string => {
    const iso = cellIso(viewYear, viewMonth0, day);
    return blockedReasonByIso?.get(iso) ?? blockedFallbackReason;
  };

  const selectDay = (day: number) => {
    if (isDisabledDay(day)) return;
    setOpenTooltipIso(null);
    setPicked(new Date(viewYear, viewMonth0, day));
  };

  const monthLabel = new Date(viewYear, viewMonth0, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonthDate = new Date(viewYear, viewMonth0 - 1, 1);
  const prevDisabled = !monthHasSelectableDays(
    prevMonthDate.getFullYear(),
    prevMonthDate.getMonth(),
    minDate,
  );

  const goPrevMonth = () => {
    if (prevDisabled) return;
    setOpenTooltipIso(null);
    setViewYear(prevMonthDate.getFullYear());
    setViewMonth0(prevMonthDate.getMonth());
  };

  const goNextMonth = () => {
    setOpenTooltipIso(null);
    const d = new Date(viewYear, viewMonth0 + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  };

  const pickedOk = picked !== null && picked >= minDate && !blockedIsoDates?.has(toISOLocalDate(picked));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[color-mix(in_srgb,var(--shamell-night)_74%,transparent)] px-4 py-8 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-date-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gold/35 bg-[linear-gradient(165deg,rgba(31,10,46,0.94)_0%,rgba(23,8,36,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.72)] backdrop-blur-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-gold/25 bg-gold/5 p-2 text-gold/90 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="border-b border-gold/18 px-5 py-4 pr-14">
          <p
            id="contact-date-picker-title"
            className="font-brand text-[10px] tracking-[0.22em] text-gold/95 uppercase"
          >
            {title}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={prevDisabled}
              className="rounded-lg border border-gold/30 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-brand text-sm tracking-[0.14em] text-gold text-center">{monthLabel}</span>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-lg border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-[10px] font-brand tracking-[0.14em] text-gold/55">
                {w}
              </div>
            ))}
            {cells.map((day, idx) =>
              day === null ? (
                <div key={`e-${idx}`} className="aspect-square" />
              ) : (() => {
                const iso = cellIso(viewYear, viewMonth0, day);
                const availBlocked = isAvailabilityBlocked(day);
                const pastOnly = isPastOrBeforeMin(day) && !availBlocked;
                const reasonRaw = availBlocked ? blockedReasonFor(day) : "";
                const reasonDisplay = availBlocked ? formatBlockedDayMotivo(reasonRaw) : "";

                if (pastOnly) {
                  return (
                    <div
                      key={`${viewYear}-${viewMonth0}-${day}`}
                      className="flex aspect-square items-center justify-center rounded-lg border border-transparent text-sm font-body text-foreground/30"
                      aria-hidden
                    >
                      {day}
                    </div>
                  );
                }

                if (availBlocked) {
                  const tipPinned = openTooltipIso === iso;
                  return (
                    <div
                      key={`${viewYear}-${viewMonth0}-${day}`}
                      data-calendar-blocked-tip-anchor
                      className={cn(
                        "group relative aspect-square",
                        tipPinned && "z-[160]",
                      )}
                    >
                      <button
                        type="button"
                        className={cn(
                          "relative flex aspect-square w-full items-center justify-center rounded-lg border border-transparent text-sm font-body text-foreground/35 decoration-foreground/25 line-through",
                          "cursor-pointer transition-colors hover:bg-gold/10 hover:text-foreground/55 md:cursor-help",
                          tipPinned && "bg-gold/12 text-foreground/50",
                        )}
                        aria-label={`Día ${day}. ${reasonDisplay}`}
                        aria-describedby={tipPinned ? `blocked-tip-${iso}` : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            typeof window !== "undefined" &&
                            window.matchMedia("(hover: hover) and (pointer: fine)").matches
                          ) {
                            return;
                          }
                          setOpenTooltipIso((cur) => (cur === iso ? null : iso));
                        }}
                      >
                        {day}
                      </button>
                      <div
                        role="tooltip"
                        id={`blocked-tip-${iso}`}
                        className={cn(
                          "pointer-events-none absolute left-1/2 top-full z-[140] mt-1 w-max max-w-[220px] -translate-x-1/2 rounded-lg border border-gold/35 bg-[rgba(10,4,8,0.96)] px-3 py-2 text-left font-body text-[11px] leading-snug text-foreground/90 shadow-[0_12px_40px_rgba(0,0,0,0.65)] backdrop-blur-md transition-opacity duration-150",
                          "invisible opacity-0",
                          "group-hover:visible group-hover:opacity-100",
                          tipPinned && "visible opacity-100",
                        )}
                      >
                        {reasonDisplay}
                      </div>
                    </div>
                  );
                }

                const selectable =
                  picked !== null &&
                  picked.getFullYear() === viewYear &&
                  picked.getMonth() === viewMonth0 &&
                  picked.getDate() === day;

                return (
                  <button
                    key={`${viewYear}-${viewMonth0}-${day}`}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      "aspect-square rounded-lg border text-sm font-body transition-colors",
                      selectable && "border-gold bg-gold/20 text-gold-light",
                      !selectable && "border-gold/20 text-foreground hover:border-gold/45 hover:bg-gold/10",
                    )}
                  >
                    {day}
                  </button>
                );
              })(),
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/18 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-foreground/75 uppercase transition hover:border-gold/50 hover:text-gold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!pickedOk}
            onClick={() => {
              if (pickedOk && picked) {
                onConfirm(toISOLocalDate(picked));
                onClose();
              }
            }}
            className="rounded-xl border border-gold/40 bg-gold/12 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold uppercase transition hover:bg-gold/22 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
