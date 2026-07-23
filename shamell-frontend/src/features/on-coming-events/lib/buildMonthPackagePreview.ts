import type { ClassSessionPublic } from "../services/fetchUpcomingClassSessions";
import type { MonthPackageOffer } from "../services/fetchOnComingEventDetail";

function sessionMonthIso(startsAt: string, timezone: string): string {
  const date = new Date(startsAt);
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone || "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  return iso.slice(0, 7);
}

export function countMonthSessions(
  sessions: ClassSessionPublic[],
  monthIso: string,
  timezone: string,
): number {
  const now = Date.now();
  return sessions.filter((session) => {
    if (new Date(session.endsAt).getTime() <= now) return false;
    return sessionMonthIso(session.startsAt, session.timezone || timezone) === monthIso;
  }).length;
}

export function isMonthPackagePurchasable(
  offer: MonthPackageOffer | null | undefined,
): boolean {
  return offer?.purchasable === true;
}

export function listMonthSessions(
  sessions: ClassSessionPublic[],
  monthIso: string,
  timezone: string,
): ClassSessionPublic[] {
  const now = Date.now();
  return sessions
    .filter((session) => {
      if (new Date(session.endsAt).getTime() <= now) return false;
      return sessionMonthIso(session.startsAt, session.timezone || timezone) === monthIso;
    })
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function formatMonthLabel(monthIso: string): string {
  const [year, month] = monthIso.split("-").map(Number);
  if (!year || !month) return monthIso;
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function buildMonthPackagePreview(params: {
  monthIso: string;
  sessions: ClassSessionPublic[];
  timezone: string;
  weekdayLabels: string[];
}): { sessionCount: number; weekdaySummary: string; monthLabel: string } {
  const sessionCount = countMonthSessions(
    params.sessions,
    params.monthIso,
    params.timezone,
  );
  return {
    sessionCount,
    weekdaySummary: params.weekdayLabels.join(", "),
    monthLabel: formatMonthLabel(params.monthIso),
  };
}
