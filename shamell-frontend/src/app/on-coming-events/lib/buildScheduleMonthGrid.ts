import { parseISOLocal, toISOLocalDate } from "@/lib/contactLogisticsUtils";

export type ScheduleMonthCell = {
  iso: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isEventDay: boolean;
  inSalesRange: boolean;
  isRecurringDay: boolean;
};

export type ScheduleMonthGrid = {
  year: number;
  month: number; // 0-indexed
  cells: ScheduleMonthCell[];
};

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayHeaders(): string[] {
  return WEEKDAY_HEADERS;
}

function compareIso(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function isInRange(iso: string, start: string, end: string): boolean {
  return compareIso(iso, start) >= 0 && compareIso(iso, end) <= 0;
}

export function buildScheduleMonthGrid(params: {
  year: number;
  month: number;
  mode: "FIXED_EVENT" | "RECURRING_WEEKLY";
  eventDate?: string | null;
  salesWindow?: { start: string; end: string } | null;
  activeWeekdays?: number[];
  anchorDate?: string | null;
}): ScheduleMonthGrid {
  const { year, month, mode } = params;
  const todayIso = toISOLocalDate(new Date());
  const firstOfMonth = new Date(year, month, 1);
  const startPad = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startPad);

  const eventDate = params.eventDate ?? null;
  const salesWindow = params.salesWindow ?? null;
  const activeWeekdays = params.activeWeekdays ?? [];
  const anchorDate = params.anchorDate ?? null;

  const cells: ScheduleMonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const iso = toISOLocalDate(d);
    const inMonth = d.getMonth() === month;
    const weekday = d.getDay();

    let isRecurringDay = false;
    if (mode === "RECURRING_WEEKLY" && inMonth && activeWeekdays.includes(weekday)) {
      if (!anchorDate || compareIso(iso, anchorDate) >= 0) {
        isRecurringDay = true;
      }
    }

    const inSalesRange =
      mode === "FIXED_EVENT" &&
      inMonth &&
      salesWindow != null &&
      isInRange(iso, salesWindow.start, salesWindow.end);

    const isEventDay =
      mode === "FIXED_EVENT" && inMonth && eventDate != null && iso === eventDate;

    cells.push({
      iso,
      day: d.getDate(),
      inMonth,
      isToday: iso === todayIso,
      isEventDay,
      inSalesRange: inSalesRange && !isEventDay,
      isRecurringDay,
    });
  }

  return { year, month, cells };
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function getNextOccurrence(
  activeWeekdays: number[],
  fromIso: string,
  maxDays = 366,
): string | null {
  if (activeWeekdays.length === 0) return null;
  const start = parseISOLocal(fromIso) ?? new Date();
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const iso = toISOLocalDate(d);
    if (activeWeekdays.includes(d.getDay())) {
      if (i === 0 || compareIso(iso, fromIso) >= 0) return iso;
    }
  }
  return null;
}

export function getNextOccurrenceAfter(
  activeWeekdays: number[],
  afterIso: string,
): string | null {
  const after = parseISOLocal(afterIso);
  if (!after) return getNextOccurrence(activeWeekdays, afterIso);
  const next = new Date(after.getFullYear(), after.getMonth(), after.getDate() + 1);
  return getNextOccurrence(activeWeekdays, toISOLocalDate(next));
}

export function parseMonthFromAnchor(anchorDate: string | null): { year: number; month: number } {
  const now = new Date();
  if (anchorDate) {
    const d = parseISOLocal(anchorDate);
    if (d) return { year: d.getFullYear(), month: d.getMonth() };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}
