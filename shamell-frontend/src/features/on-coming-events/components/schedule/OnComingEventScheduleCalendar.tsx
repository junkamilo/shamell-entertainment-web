"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toISOLocalDate } from "@/lib/contactLogisticsUtils";
import {
  buildScheduleMonthGrid,
  getNextOccurrence,
  monthLabel,
  parseMonthFromAnchor,
  weekdayHeaders,
} from "../../lib/buildScheduleMonthGrid";
import {
  formatOccurrenceDate,
  type ScheduleViewModel,
} from "../../lib/parseScheduleViewModel";

type Props = {
  model: ScheduleViewModel;
  /** When set, highlighted recurring days open booking for that date. */
  onDateClick?: (iso: string) => void;
  bookable?: boolean;
  /** Larger, vertically centered layout for the mobile swipe panel. */
  mobileSlide?: boolean;
};

function compareIso(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function OnComingEventScheduleCalendar({
  model,
  onDateClick,
  bookable = false,
  mobileSlide = false,
}: Props) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const initial = parseMonthFromAnchor(model.anchorDate);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);

  const grid = useMemo(
    () =>
      buildScheduleMonthGrid({
        year: viewYear,
        month: viewMonth,
        mode: model.mode,
        eventDate: model.eventDate,
        salesWindow: model.salesWindow,
        activeWeekdays: model.activeWeekdays,
        anchorDate: model.anchorDate,
      }),
    [viewYear, viewMonth, model],
  );

  const headers = weekdayHeaders();
  const todayIso = toISOLocalDate(new Date());

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const tooltipIso = hoveredIso ?? todayIso;
  const tooltipNext =
    model.mode === "RECURRING_WEEKLY" && model.activeWeekdays.length > 0 ?
      getNextOccurrence(model.activeWeekdays, tooltipIso)
    : null;

  const tooltipText =
    model.mode === "RECURRING_WEEKLY" && tooltipNext ?
      `Next: ${formatOccurrenceDate(tooltipNext)}${model.timeRangeLabel ? ` · ${model.timeRangeLabel}` : ""}`
    : model.mode === "FIXED_EVENT" && model.eventDate ?
      `Event: ${formatOccurrenceDate(model.eventDate)}`
    : null;

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        mobileSlide && "min-h-[min(68dvh,26rem)] justify-center py-2",
      )}
      aria-label="Event calendar"
    >
      <div
        className={cn(
          "mb-3 flex items-center justify-between gap-2",
          mobileSlide && "mb-4",
        )}
      >
        <p
          className={cn(
            "font-brand text-xs tracking-[0.14em] text-gold/80",
            mobileSlide && "text-sm",
          )}
        >
          CALENDAR
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-gold/25 p-1 text-gold/80 transition hover:border-gold/50 hover:bg-gold/10"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span
            className={cn(
              "min-w-[7.5rem] text-center font-body text-foreground/90",
              mobileSlide ? "text-sm" : "text-xs sm:text-sm",
            )}
          >
            {monthLabel(viewYear, viewMonth)}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="rounded-lg border border-gold/25 p-1 text-gold/80 transition hover:border-gold/50 hover:bg-gold/10"
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div
        className={cn(
          "mb-3 grid w-full grid-cols-7",
          mobileSlide ? "gap-1.5" : "gap-1",
        )}
        role="list"
        aria-label="Days of week"
      >
        {headers.map((label, idx) => {
          const active =
            model.mode === "RECURRING_WEEKLY" && model.activeWeekdays.includes(idx);
          return (
            <motion.div
              key={label}
              role="listitem"
              className="flex flex-col items-center gap-1"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.35 }}
            >
              <span
                className={cn(
                  "font-medium tracking-wide text-foreground/50",
                  mobileSlide ? "text-[10px]" : "text-[9px]",
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  "flex items-center justify-center rounded-full font-semibold transition-colors",
                  mobileSlide ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs",
                  active ?
                    "border border-gold/60 bg-gold/20 text-gold shadow-[0_0_20px_rgba(197,165,90,0.25)]"
                  : "border border-gold/15 bg-black/20 text-foreground/40",
                )}
              >
                {label.slice(0, 1)}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Month grid — hover cleared on grid leave to avoid flicker between adjacent cells */}
      <div
        className={cn(
          "grid w-full grid-cols-7",
          mobileSlide ? "gap-1.5" : "gap-1 sm:gap-1.5",
        )}
        role="grid"
        aria-label={`${monthLabel(viewYear, viewMonth)}`}
        onMouseLeave={() => setHoveredIso(null)}
      >
        {headers.map((h) => (
          <div
            key={`h-${h}`}
            className={cn(
              "pb-0.5 text-center font-medium text-foreground/45",
              mobileSlide ? "text-xs" : "text-[10px] sm:text-xs",
            )}
            role="columnheader"
          >
            {h}
          </div>
        ))}
        {grid.cells.map((cell) => {
          const highlight =
            cell.isEventDay || cell.isRecurringDay || cell.inSalesRange;
          const interactive = cell.inMonth && (cell.isRecurringDay || cell.isEventDay);
          const anchor = model.anchorDate ?? null;
          const pastOrBeforeAnchor =
            compareIso(cell.iso, todayIso) < 0 ||
            (anchor != null && compareIso(cell.iso, anchor) < 0);
          const clickableBookDay =
            bookable &&
            onDateClick != null &&
            model.mode === "RECURRING_WEEKLY" &&
            cell.inMonth &&
            cell.isRecurringDay &&
            !pastOrBeforeAnchor;
          const isHovered = hoveredIso === cell.iso;

          return (
            <button
              key={cell.iso}
              type="button"
              role="gridcell"
              disabled={!cell.inMonth || (bookable && cell.isRecurringDay && pastOrBeforeAnchor)}
              onClick={() => {
                if (clickableBookDay) onDateClick(cell.iso);
              }}
              onMouseEnter={() => {
                if (interactive) setHoveredIso(cell.iso);
              }}
              onFocus={() => {
                if (interactive) setHoveredIso(cell.iso);
              }}
              onBlur={() => setHoveredIso(null)}
              className={cn(
                "relative flex w-full items-center justify-center rounded-md font-semibold tabular-nums transition-colors",
                mobileSlide ?
                  "h-11 rounded-lg text-base"
                : "h-8 text-sm sm:h-9 sm:rounded-lg sm:text-base",
                !cell.inMonth && "pointer-events-none opacity-0",
                cell.inMonth && !highlight && "text-foreground/55 hover:bg-white/5",
                cell.inSalesRange && "bg-gold/10 text-foreground/80",
                cell.isRecurringDay && "bg-gold/18 text-gold",
                cell.isEventDay &&
                  "bg-gold/25 font-bold text-gold-light ring-2 ring-gold/70",
                cell.isToday && !cell.isEventDay && "ring-1 ring-gold/35",
                clickableBookDay && "cursor-pointer",
                clickableBookDay &&
                  (isHovered ?
                    "bg-gold/28 ring-1 ring-gold/55"
                  : "hover:bg-gold/22 hover:ring-1 hover:ring-gold/45"),
                bookable && cell.isRecurringDay && pastOrBeforeAnchor && "opacity-40",
              )}
              aria-label={
                clickableBookDay ? `Book class on ${cell.iso}` : undefined
              }
            >
              {cell.day}
              {cell.isEventDay ? (
                <Star
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 fill-gold text-gold sm:h-3 sm:w-3"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {bookable && model.mode === "RECURRING_WEEKLY" ?
        <p
          className={cn(
            "mt-2 text-center text-foreground/60",
            mobileSlide ? "text-xs" : "text-[10px] sm:text-xs",
          )}
        >
          Tap a highlighted date to choose your class time
        </p>
      : null}

      {tooltipText ? (
        <p
          className={cn(
            "mt-3 w-full rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-center leading-snug text-foreground/85",
            mobileSlide ?
              "min-h-[3rem] text-sm"
            : "min-h-[2.75rem] text-xs sm:min-h-[3rem] sm:text-sm",
          )}
          role="status"
          aria-live="polite"
        >
          {tooltipText}
        </p>
      ) : null}

      {model.mode === "FIXED_EVENT" ? (
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-[9px] text-foreground/55 sm:text-[10px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-gold/15 ring-1 ring-gold/25" />
            Sales window
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-gold/25 ring-2 ring-gold/60" />
            Event day
          </span>
        </div>
      ) : null}
    </div>
  );
}
