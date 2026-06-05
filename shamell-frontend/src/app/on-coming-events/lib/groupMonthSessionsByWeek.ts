import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";

export type MonthSessionWeekGroup = {
  weekIndex: number;
  label: string;
  dateRangeLabel: string;
  sessions: ClassSessionPublic[];
};

function datePartsInTimezone(isoDateTime: string, timezone: string): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(isoDateTime));

  const year = Number(parts.find((part) => part.type === "year")?.value ?? 0);
  const month = Number(parts.find((part) => part.type === "month")?.value ?? 0);
  const day = Number(parts.find((part) => part.type === "day")?.value ?? 0);
  return { year, month, day };
}

function monthIsoInTimezone(isoDateTime: string, timezone: string): string {
  const { year, month } = datePartsInTimezone(isoDateTime, timezone);
  if (!year || !month) return "";
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatRangeDate(isoDateTime: string, timezone: string): string {
  return new Date(isoDateTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: timezone || "America/New_York",
  });
}

export function groupMonthSessionsByWeek(
  sessions: ClassSessionPublic[],
  monthIso: string,
  timezone: string,
): MonthSessionWeekGroup[] {
  const byWeek = new Map<number, ClassSessionPublic[]>();

  for (const session of sessions) {
    const sessionTz = session.timezone || timezone;
    if (monthIsoInTimezone(session.startsAt, sessionTz) !== monthIso) continue;
    const { day } = datePartsInTimezone(session.startsAt, sessionTz);
    if (!day) continue;
    const weekIndex = Math.floor((day - 1) / 7) + 1;
    const weekSessions = byWeek.get(weekIndex);
    if (weekSessions) {
      weekSessions.push(session);
    } else {
      byWeek.set(weekIndex, [session]);
    }
  }

  return [...byWeek.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([weekIndex, weekSessions]) => {
      const sortedSessions = [...weekSessions].sort((a, b) =>
        a.startsAt.localeCompare(b.startsAt),
      );
      const first = sortedSessions[0];
      const last = sortedSessions[sortedSessions.length - 1];
      const dateRangeLabel =
        first && last ?
          formatRangeDate(first.startsAt, first.timezone || timezone) ===
            formatRangeDate(last.startsAt, last.timezone || timezone) ?
            formatRangeDate(first.startsAt, first.timezone || timezone)
          : `${formatRangeDate(first.startsAt, first.timezone || timezone)} - ${formatRangeDate(last.startsAt, last.timezone || timezone)}`
        : "";

      return {
        weekIndex,
        label: `Week ${weekIndex}`,
        dateRangeLabel,
        sessions: sortedSessions,
      };
    });
}
