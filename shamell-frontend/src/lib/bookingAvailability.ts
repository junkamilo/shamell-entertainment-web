import { hhmmToMinutes } from "@/components/contact/contactLogisticsUtils";

const WEEKDAY_FROM_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export type PublicWeeklySlot = {
  weekday: number;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};

export type PublicClosure = {
  kind: "SPECIFIC_DATE" | "RECURRING_WEEKDAY" | "DATE_RANGE";
  date: string | null;
  weekday: number | null;
  startDate: string | null;
  endDate: string | null;
  /** Admin-visible note exposed publicly so booking UI can explain blocked days. */
  note?: string | null;
};

export type PublicAvailabilityRules = {
  timeZone: string;
  weekly: PublicWeeklySlot[];
  closures: PublicClosure[];
};

/** Today's calendar date YYYY-MM-DD in the given IANA zone. */
export function isoDateInTzNow(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDaysISO(iso: string, delta: number): string {
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const next = new Date(Date.UTC(y, m - 1, d + delta));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/** Weekday 0–6 (Sun–Sat) for a civil `YYYY-MM-DD` interpreted in `tz`. */
export function bookingWeekdayFromIsoDate(dateISO: string, tz: string): number {
  let t = Date.parse(`${dateISO}T12:00:00Z`);
  if (Number.isNaN(t)) return 0;
  for (let i = 0; i < 10; i++) {
    const wallIso = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(t));
    if (wallIso === dateISO) {
      const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date(t));
      return WEEKDAY_FROM_SHORT[wd] ?? 0;
    }
    t += (dateISO < wallIso ? -1 : 1) * 86400000;
  }
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date(t));
  return WEEKDAY_FROM_SHORT[wd] ?? 0;
}

export function expandBlockedDates(
  tz: string,
  weekly: PublicWeeklySlot[],
  closures: PublicClosure[],
  daysAhead: number,
): Set<string> {
  const blocked = new Set<string>();
  const todayIso = isoDateInTzNow(tz);
  const specific = new Set(
    closures.filter((c) => c.kind === "SPECIFIC_DATE" && c.date).map((c) => c.date as string),
  );
  const recurring = new Set(
    closures.filter((c) => c.kind === "RECURRING_WEEKDAY" && c.weekday != null).map((c) => c.weekday as number),
  );
  const ranges = closures.filter(
    (c) => c.kind === "DATE_RANGE" && c.startDate && c.endDate,
  ) as Array<PublicClosure & { startDate: string; endDate: string }>;

  for (let i = 0; i < daysAhead; i++) {
    const iso = addDaysISO(todayIso, i);
    if (specific.has(iso)) {
      blocked.add(iso);
      continue;
    }
    const wd = bookingWeekdayFromIsoDate(iso, tz);
    if (recurring.has(wd)) {
      blocked.add(iso);
      continue;
    }
    if (ranges.some((r) => iso >= r.startDate && iso <= r.endDate)) {
      blocked.add(iso);
      continue;
    }
    const slot = weekly.find((w) => w.weekday === wd);
    if (slot?.isClosed) blocked.add(iso);
  }
  return blocked;
}

/**
 * Human-readable reason per blocked ISO date (for tooltips). Mirrors priority in `expandBlockedDates`.
 */
export function expandBlockedDateReasonsMap(
  tz: string,
  weekly: PublicWeeklySlot[],
  closures: PublicClosure[],
  daysAhead: number,
): Map<string, string> {
  const map = new Map<string, string>();
  const blocked = expandBlockedDates(tz, weekly, closures, daysAhead);

  const pushUnique = (iso: string, msg: string) => {
    const prev = map.get(iso);
    if (!prev) map.set(iso, msg);
    else if (!prev.includes(msg)) map.set(iso, `${prev} · ${msg}`);
  };

  for (const iso of [...blocked].sort()) {
    const wd = bookingWeekdayFromIsoDate(iso, tz);

    const specificMsgs = closures
      .filter((c) => c.kind === "SPECIFIC_DATE" && c.date === iso)
      .map((c) => (c.note?.trim() ? c.note.trim() : "Este día no está disponible."));
    if (specificMsgs.length) {
      pushUnique(iso, [...new Set(specificMsgs)].join(" · "));
      continue;
    }

    const recurringMsgs = closures
      .filter((c) => c.kind === "RECURRING_WEEKDAY" && c.weekday === wd)
      .map((c) =>
        c.note?.trim() ? c.note.trim() : "Este día de la semana no está disponible.",
      );
    if (recurringMsgs.length) {
      pushUnique(iso, [...new Set(recurringMsgs)].join(" · "));
      continue;
    }

    const rangeMsgs = closures
      .filter(
        (c) =>
          c.kind === "DATE_RANGE" &&
          c.startDate &&
          c.endDate &&
          iso >= c.startDate &&
          iso <= c.endDate,
      )
      .map((c) => (c.note?.trim() ? c.note.trim() : "No disponible en este periodo."));
    if (rangeMsgs.length) {
      pushUnique(iso, [...new Set(rangeMsgs)].join(" · "));
      continue;
    }

    const slot = weekly.find((w) => w.weekday === wd);
    if (slot?.isClosed) {
      map.set(iso, "Sin horario de reserva este día.");
    }
  }

  return map;
}

export function timeBoundsForDateISO(
  dateISO: string,
  tz: string,
  weekly: PublicWeeklySlot[],
): { minMinutes: number; maxMinutes: number } | undefined {
  const wd = bookingWeekdayFromIsoDate(dateISO, tz);
  const slot = weekly.find((w) => w.weekday === wd);
  if (!slot || slot.isClosed) return undefined;
  if (!slot.startTime || !slot.endTime) {
    return { minMinutes: 0, maxMinutes: 24 * 60 - 1 };
  }
  const a = hhmmToMinutes(slot.startTime);
  const b = hhmmToMinutes(slot.endTime);
  if (a === null || b === null) return undefined;
  return { minMinutes: a, maxMinutes: b };
}

function daysBetweenIsoUtc(a: string, b: string): number {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const ta = Date.UTC(pa[0], pa[1] - 1, pa[2]);
  const tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
  return Math.round((ta - tb) / 86400000);
}

function zonedWallClockParts(date: Date, timeZone: string): {
  dateISO: string;
  weekday: number;
  minutesSinceMidnight: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const g = (t: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === t)?.value ?? "";
  const wdShort = g("weekday");
  const weekday = WEEKDAY_FROM_SHORT[wdShort];
  if (weekday === undefined) {
    throw new Error("Could not resolve weekday for booking timezone.");
  }
  const y = g("year");
  const m = g("month");
  const d = g("day");
  const dateISO = `${y}-${m}-${d}`;
  const hour = Number.parseInt(g("hour"), 10);
  const minute = Number.parseInt(g("minute"), 10);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error("Could not resolve time for booking timezone.");
  }
  return { dateISO, weekday, minutesSinceMidnight: hour * 60 + minute };
}

/**
 * Calendar date + wall-clock minutes in IANA `timeZone` → UTC instant.
 * Matches backend `utcInstantForWallClock` so admin-created bookings align with availability checks.
 */
export function utcInstantForWallClock(dateISO: string, minutesSinceMidnight: number, timeZone: string): Date {
  const parts = dateISO.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const d = parts[2];
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    throw new Error("Invalid calendar date.");
  }
  let t = Date.UTC(y, mo - 1, d, 12, 0, 0);
  for (let i = 0; i < 24; i++) {
    const wall = zonedWallClockParts(new Date(t), timeZone);
    const dd = daysBetweenIsoUtc(dateISO, wall.dateISO);
    const dm = minutesSinceMidnight - wall.minutesSinceMidnight;
    if (dd === 0 && dm === 0) return new Date(t);
    t += dd * 86400000 + dm * 60000;
  }
  return new Date(t);
}
