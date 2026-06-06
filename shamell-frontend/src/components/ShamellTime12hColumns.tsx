"use client";

import { useId, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { isTimeSlotSelectable } from "@/lib/contactLogisticsUtils";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export type ShamellTime12hParts = { h12: number; min: number; ap: "AM" | "PM" };

export type ShamellTime12hColumnsProps = {
  value: ShamellTime12hParts;
  onChange: (next: ShamellTime12hParts) => void;
  /** Minutes from midnight (24h), inclusive. */
  timeClamp?: { minMinutes: number; maxMinutes: number };
  /** Occupied windows (inclusive). */
  blockedRanges?: Array<{ startMinutes: number; endMinutes: number }>;
  /** Optional labels (defaults match contact / admin pickers). */
  labels?: { hour?: string; minute?: string; period?: string };
  className?: string;
};

function resolveSelection(
  prev: ShamellTime12hParts,
  patch: Partial<ShamellTime12hParts>,
  timeClamp: ShamellTime12hColumnsProps["timeClamp"],
  blockedRanges: ShamellTime12hColumnsProps["blockedRanges"],
): ShamellTime12hParts {
  const h12 = patch.h12 ?? prev.h12;
  let min = patch.min ?? prev.min;
  const ap = patch.ap ?? prev.ap;

  const ensureMinute = (h: number, m: number, a: "AM" | "PM") => {
    if (isTimeSlotSelectable(h, m, a, timeClamp, blockedRanges)) return m;
    const first = MINUTES.find((mm) => isTimeSlotSelectable(h, mm, a, timeClamp, blockedRanges));
    return first ?? m;
  };

  if (patch.h12 !== undefined || patch.ap !== undefined) {
    min = ensureMinute(h12, min, ap);
  }
  if (patch.min !== undefined && patch.h12 === undefined && patch.ap === undefined) {
    if (!isTimeSlotSelectable(h12, min, ap, timeClamp, blockedRanges)) {
      min = ensureMinute(h12, min, ap);
    }
  }
  return { h12, min, ap };
}

/**
 * Inline 12-hour time picker: hour + minute scroll lists and AM/PM segment.
 * Reusable in modals (contact/agendar) and inline forms (e.g. admin booking edit).
 */
export default function ShamellTime12hColumns({
  value,
  onChange,
  timeClamp,
  blockedRanges,
  labels,
  className,
}: ShamellTime12hColumnsProps) {
  const { h12, min, ap } = value;
  const uid = useId().replace(/:/g, "");
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const hourLabelId = `${uid}-hour-lbl`;
  const minuteLabelId = `${uid}-minute-lbl`;

  const hourLabel = labels?.hour ?? "HOUR";
  const minuteLabel = labels?.minute ?? "MINUTE";
  const periodLabel = labels?.period ?? "PERIOD";

  const hourSelectable = (h: number) =>
    MINUTES.some((m) => isTimeSlotSelectable(h, m, ap, timeClamp, blockedRanges));

  const emit = (patch: Partial<ShamellTime12hParts>) => {
    onChange(resolveSelection(value, patch, timeClamp, blockedRanges));
  };

  const focusNextSelectableHour = (dir: 1 | -1) => {
    const start = HOURS.indexOf(h12);
    if (start < 0) return;
    for (let step = 1; step <= HOURS.length; step++) {
      const idx = (start + dir * step + HOURS.length * 10) % HOURS.length;
      const h = HOURS[idx];
      if (hourSelectable(h)) {
        emit({ h12: h });
        return;
      }
    }
  };

  const focusNextSelectableMinute = (dir: 1 | -1) => {
    for (let step = 1; step <= MINUTES.length; step++) {
      const m = (min + dir * step + MINUTES.length * 10) % MINUTES.length;
      if (isTimeSlotSelectable(h12, m, ap, timeClamp, blockedRanges)) {
        emit({ min: m });
        return;
      }
    }
  };

  useLayoutEffect(() => {
    const el = hourListRef.current?.querySelector<HTMLElement>(`[data-hour="${h12}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [h12, ap]);

  useLayoutEffect(() => {
    const el = minuteListRef.current?.querySelector<HTMLElement>(`[data-minute="${min}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [min, h12, ap]);

  const listboxShell =
    "mt-2 max-h-[min(14rem,calc(50vh-8rem))] min-h-[10.5rem] overflow-y-auto overscroll-contain rounded-xl border border-gold/35 bg-[#170824] py-1 shamell-scrollbar outline-none focus-visible:ring-2 focus-visible:ring-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#170824]";

  const optionRow =
    "flex w-full items-center justify-center px-2 py-2.5 text-center font-body text-base font-medium transition-colors";

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <div className="block min-w-0">
        <span id={hourLabelId} className="font-brand text-xs tracking-[0.16em] text-gold/90">
          {hourLabel}
        </span>
        <div
          ref={hourListRef}
          role="listbox"
          aria-labelledby={hourLabelId}
          aria-activedescendant={`st12-${uid}-hour-${h12}`}
          tabIndex={0}
          className={listboxShell}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              focusNextSelectableHour(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              focusNextSelectableHour(-1);
            } else if (e.key === "Home") {
              e.preventDefault();
              const first = HOURS.find((h) => hourSelectable(h));
              if (first !== undefined) emit({ h12: first });
            } else if (e.key === "End") {
              e.preventDefault();
              const last = [...HOURS].reverse().find((h) => hourSelectable(h));
              if (last !== undefined) emit({ h12: last });
            }
          }}
        >
          {HOURS.map((h) => {
            const enabled = hourSelectable(h);
            const selected = h12 === h;
            return (
              <button
                key={h}
                id={`st12-${uid}-hour-${h}`}
                type="button"
                role="option"
                tabIndex={-1}
                data-hour={h}
                aria-selected={selected}
                disabled={!enabled}
                onClick={() => enabled && emit({ h12: h })}
                className={cn(
                  optionRow,
                  selected && enabled && "bg-gold/30 text-gold-bright",
                  !selected && enabled && "text-foreground hover:bg-gold/15",
                  !enabled && "cursor-not-allowed text-foreground/35",
                )}
              >
                {h}
              </button>
            );
          })}
        </div>
      </div>
      <div className="block min-w-0">
        <span id={minuteLabelId} className="font-brand text-xs tracking-[0.16em] text-gold/90">
          {minuteLabel}
        </span>
        <div
          ref={minuteListRef}
          role="listbox"
          aria-labelledby={minuteLabelId}
          aria-activedescendant={`st12-${uid}-minute-${min}`}
          tabIndex={0}
          className={listboxShell}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              focusNextSelectableMinute(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              focusNextSelectableMinute(-1);
            } else if (e.key === "Home") {
              e.preventDefault();
              const first = MINUTES.find((m) => isTimeSlotSelectable(h12, m, ap, timeClamp, blockedRanges));
              if (first !== undefined) emit({ min: first });
            } else if (e.key === "End") {
              e.preventDefault();
              const last = [...MINUTES].reverse().find((m) =>
                isTimeSlotSelectable(h12, m, ap, timeClamp, blockedRanges),
              );
              if (last !== undefined) emit({ min: last });
            }
          }}
        >
          {MINUTES.map((m) => {
            const enabled = isTimeSlotSelectable(h12, m, ap, timeClamp, blockedRanges);
            const selected = min === m;
            return (
              <button
                key={m}
                id={`st12-${uid}-minute-${m}`}
                type="button"
                role="option"
                tabIndex={-1}
                data-minute={m}
                aria-selected={selected}
                disabled={!enabled}
                onClick={() => enabled && emit({ min: m })}
                className={cn(
                  optionRow,
                  selected && enabled && "bg-gold/30 text-gold-bright",
                  !selected && enabled && "text-foreground hover:bg-gold/15",
                  !enabled && "cursor-not-allowed text-foreground/35",
                )}
              >
                {String(m).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>
      <div className="block min-w-0">
        <span className="font-brand text-xs tracking-[0.16em] text-gold/90">{periodLabel}</span>
        <div className="mt-2 grid min-h-[48px] grid-cols-2 gap-1 rounded-xl border border-gold/35 bg-[#170824] p-1">
          {(["AM", "PM"] as const).map((p) => {
            const periodOk = isTimeSlotSelectable(h12, min, p, timeClamp, blockedRanges);
            return (
              <button
                key={p}
                type="button"
                disabled={!periodOk}
                onClick={() => emit({ ap: p })}
                className={cn(
                  "rounded-lg py-2.5 font-brand text-xs tracking-[0.14em] transition-colors",
                  ap === p ? "bg-gold/30 text-gold-bright" : "text-foreground/80 hover:bg-gold/12 hover:text-gold",
                  !periodOk && "cursor-not-allowed opacity-35 hover:text-foreground/55",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
