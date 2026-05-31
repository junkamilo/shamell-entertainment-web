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
};

export function OnComingEventScheduleCalendar({ model }: Props) {
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
    <div className="flex flex-col" aria-label="Event calendar">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-brand text-xs tracking-[0.14em] text-gold/80">CALENDAR</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="rounded-lg border border-gold/25 p-1 text-gold/80 transition hover:border-gold/50 hover:bg-gold/10"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[7.5rem] text-center font-body text-xs text-foreground/90 sm:text-sm">
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
      <div className="mb-3 grid grid-cols-7 gap-1" role="list" aria-label="Days of week">
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
              <span className="text-[9px] font-medium tracking-wide text-foreground/50">{label}</span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition",
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

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1" role="grid" aria-label={`${monthLabel(viewYear, viewMonth)}`}>
        {headers.map((h) => (
          <div
            key={`h-${h}`}
            className="pb-0.5 text-center text-[9px] font-medium text-foreground/45 sm:text-[10px]"
            role="columnheader"
          >
            {h}
          </div>
        ))}
        {grid.cells.map((cell, i) => {
          const highlight =
            cell.isEventDay || cell.isRecurringDay || cell.inSalesRange;
          const interactive = cell.inMonth && (cell.isRecurringDay || cell.isEventDay);

          return (
            <motion.button
              key={cell.iso}
              type="button"
              role="gridcell"
              disabled={!cell.inMonth}
              onMouseEnter={() => {
                if (interactive) setHoveredIso(cell.iso);
              }}
              onMouseLeave={() => setHoveredIso(null)}
              onFocus={() => {
                if (interactive) setHoveredIso(cell.iso);
              }}
              onBlur={() => setHoveredIso(null)}
              className={cn(
                "relative flex h-8 w-full items-center justify-center rounded-md text-xs transition sm:h-9 sm:rounded-lg sm:text-sm",
                !cell.inMonth && "pointer-events-none opacity-0",
                cell.inMonth && !highlight && "text-foreground/55 hover:bg-white/5",
                cell.inSalesRange && "bg-gold/10 text-foreground/80",
                cell.isRecurringDay && "bg-gold/18 font-medium text-gold",
                cell.isEventDay &&
                  "ring-2 ring-gold/70 bg-gold/25 font-semibold text-gold-light",
                cell.isToday && !cell.isEventDay && "ring-1 ring-gold/35",
              )}
              whileHover={
                prefersReducedMotion || !interactive ? undefined : { scale: 1.08, y: -2 }
              }
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: cell.inMonth ? 1 : 0, scale: 1 }}
              transition={{ delay: (i % 7) * 0.02 + Math.floor(i / 7) * 0.03, duration: 0.25 }}
            >
              {cell.day}
              {cell.isEventDay ? (
                <Star
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 fill-gold text-gold sm:h-3 sm:w-3"
                  aria-hidden
                />
              ) : null}
            </motion.button>
          );
        })}
      </div>

      {tooltipText ? (
        <motion.p
          key={tooltipText}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2 text-center text-xs text-foreground/85 sm:text-sm"
          role="status"
        >
          {tooltipText}
        </motion.p>
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
