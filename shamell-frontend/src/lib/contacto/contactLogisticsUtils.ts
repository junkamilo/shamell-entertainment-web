/** Local calendar date helpers (US-facing form; storage uses `YYYY-MM-DD`). */

export function startOfTodayLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

export function parseISOLocal(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function toISOLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDateDisplayUs(iso: string): string {
  const d = parseISOLocal(iso);
  if (!d) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function hhmmToMinutes(hhmm: string): number | null {
  const t = hhmm.trim();
  if (!/^\d{2}:\d{2}$/.test(t)) return null;
  const h = Number(t.slice(0, 2));
  const m = Number(t.slice(3, 5));
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

export type Time12hParts = { h12: number; min: number; ap: "AM" | "PM" };

/** Unambiguous US 12-hour label — always includes AM or PM (e.g. "12:00 PM" = noon). */
export function formatPartsDisplayUs(h12: number, min: number, ap: "AM" | "PM"): string {
  return `${h12}:${String(min).padStart(2, "0")} ${ap}`;
}

/** Short hint when hour is 12 to disambiguate midnight vs noon. */
export function format12hPeriodHint(h12: number, ap: "AM" | "PM"): string | null {
  if (h12 !== 12) return null;
  return ap === "AM" ? "Midnight" : "Noon";
}

export function formatTimeDisplayUs(hhmm: string): string {
  if (!/^\d{2}:\d{2}$/.test(hhmm.trim())) return "";
  const parts = hhmmToParts(hhmm);
  return formatPartsDisplayUs(parts.h12, parts.min, parts.ap);
}

export function formatMinutesAsTimeDisplayUs(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const hhmm = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return formatTimeDisplayUs(hhmm);
}

export function hhmmToParts(hhmm: string): Time12hParts {
  if (!/^\d{2}:\d{2}$/.test(hhmm.trim())) return { h12: 12, min: 0, ap: "PM" };
  const h24 = Number(hhmm.slice(0, 2));
  const min = Number(hhmm.slice(3, 5));
  if (!Number.isFinite(h24) || !Number.isFinite(min) || h24 > 23 || min > 59) {
    return { h12: 12, min: 0, ap: "PM" };
  }
  const ap: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h12, min, ap };
}

export function partsToHHMM(h12: number, min: number, ap: "AM" | "PM"): string {
  let h24: number;
  if (ap === "AM") {
    h24 = h12 === 12 ? 0 : h12;
  } else {
    h24 = h12 === 12 ? 12 : h12 + 12;
  }
  return `${String(h24).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Minutes from midnight for a 12h clock triple. */
export function minutesFromParts(h12: number, min: number, ap: "AM" | "PM"): number | null {
  return hhmmToMinutes(partsToHHMM(h12, min, ap));
}

/** True if this wall time is within `timeClamp` and not inside any `blockedRanges` (inclusive). */
export function isTimeSlotSelectable(
  h12: number,
  min: number,
  ap: "AM" | "PM",
  timeClamp?: { minMinutes: number; maxMinutes: number },
  blockedRanges?: Array<{ startMinutes: number; endMinutes: number }>,
): boolean {
  const total = minutesFromParts(h12, min, ap);
  if (total === null) return false;
  if (timeClamp) {
    if (total < timeClamp.minMinutes || total > timeClamp.maxMinutes) return false;
  }
  for (const r of blockedRanges ?? []) {
    if (total >= r.startMinutes && total <= r.endMinutes) return false;
  }
  return true;
}

/** First selectable minute in clamp order (then full day as fallback). */
export function firstSelectableMinuteParts(
  timeClamp?: { minMinutes: number; maxMinutes: number },
  blockedRanges?: Array<{ startMinutes: number; endMinutes: number }>,
): { h12: number; min: number; ap: "AM" | "PM" } {
  const ranges: Array<{ lo: number; hi: number }> = [];
  if (timeClamp) ranges.push({ lo: timeClamp.minMinutes, hi: timeClamp.maxMinutes });
  else ranges.push({ lo: 0, hi: 24 * 60 - 1 });
  for (const { lo, hi } of ranges) {
    for (let total = lo; total <= hi; total++) {
      const h24 = Math.floor(total / 60);
      const min = total % 60;
      const ap: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      if (isTimeSlotSelectable(h12, min, ap, timeClamp, blockedRanges)) {
        return { h12, min, ap };
      }
    }
  }
  if (timeClamp) {
    for (let total = 0; total < 24 * 60; total++) {
      const h24 = Math.floor(total / 60);
      const min = total % 60;
      const ap: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      if (isTimeSlotSelectable(h12, min, ap, timeClamp, blockedRanges)) {
        return { h12, min, ap };
      }
    }
  }
  return { h12: 12, min: 0, ap: "AM" };
}

export function snapToNearestSelectableParts(
  h12: number,
  min: number,
  ap: "AM" | "PM",
  timeClamp?: { minMinutes: number; maxMinutes: number },
  blockedRanges?: Array<{ startMinutes: number; endMinutes: number }>,
): { h12: number; min: number; ap: "AM" | "PM" } {
  if (isTimeSlotSelectable(h12, min, ap, timeClamp, blockedRanges)) {
    return { h12, min, ap };
  }
  return firstSelectableMinuteParts(timeClamp, blockedRanges);
}
