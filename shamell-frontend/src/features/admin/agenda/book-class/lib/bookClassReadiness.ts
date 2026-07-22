import type { BookClassEventContext } from "../types/bookClass.types";

export type BookClassReadinessReason =
  | "missing_slug"
  | "not_recurring"
  | "no_weekdays"
  | "no_sections"
  | "no_sessions";

const REASON_MESSAGES: Record<BookClassReadinessReason, string> = {
  missing_slug: "Event slug is missing.",
  not_recurring: "Recurring Weekdays (Classes) schedule is not configured.",
  no_weekdays: "No active class weekdays are configured.",
  no_sections: "No active class sections are configured.",
  no_sessions: "No upcoming sessions with available seats.",
};

function countBookableSessions(
  sessions: BookClassEventContext["sessions"],
): number {
  const now = Date.now();
  return sessions.filter(
    (session) =>
      new Date(session.endsAt).getTime() > now && session.seatsRemaining > 0,
  ).length;
}

function readinessReasonsFromContext(
  context: BookClassEventContext,
): BookClassReadinessReason[] {
  if (context.readiness?.reasons?.length) {
    return context.readiness.reasons;
  }

  const reasons: BookClassReadinessReason[] = [];
  if (!context.event.slug?.trim()) {
    reasons.push("missing_slug");
  }
  if (context.schedule?.mode !== "RECURRING_WEEKLY") {
    reasons.push("not_recurring");
  } else {
    if (context.schedule.days.length < 1) {
      reasons.push("no_weekdays");
    }
    const sectionCount = context.schedule.days.reduce(
      (total, day) => total + day.sections.length,
      0,
    );
    if (sectionCount < 1) {
      reasons.push("no_sections");
    }
  }
  if (countBookableSessions(context.sessions) < 1) {
    reasons.push("no_sessions");
  }
  return reasons;
}

export function isBookableClassContext(context: BookClassEventContext): boolean {
  if (context.readiness) {
    return context.readiness.isBookable;
  }
  return readinessReasonsFromContext(context).length === 0;
}

export function getBookClassSetupIssues(context: BookClassEventContext): string[] {
  return readinessReasonsFromContext(context).map(
    (reason) => REASON_MESSAGES[reason],
  );
}
