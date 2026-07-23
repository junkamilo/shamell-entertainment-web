import { ReservationEventScheduleMode } from '@prisma/client';

export type BookClassReadinessReason =
  | 'missing_slug'
  | 'not_recurring'
  | 'no_weekdays'
  | 'no_sections'
  | 'no_sessions';

export type ClassEventTemplateSnapshot = {
  scheduleMode: ReservationEventScheduleMode;
  timezone: string;
  activeWeekdayCount: number;
  activeSectionCount: number;
};

export type AssessClassReadinessInput = {
  slug: string | null | undefined;
  template: ClassEventTemplateSnapshot | null;
  upcomingSessionCount: number;
};

export type ClassReadinessAssessment = {
  isBookable: boolean;
  reasons: BookClassReadinessReason[];
};

export function assessClassEventReadiness(
  input: AssessClassReadinessInput,
): ClassReadinessAssessment {
  const reasons: BookClassReadinessReason[] = [];

  if (!input.slug?.trim()) {
    reasons.push('missing_slug');
  }

  if (
    !input.template ||
    input.template.scheduleMode !==
      ReservationEventScheduleMode.RECURRING_WEEKLY
  ) {
    reasons.push('not_recurring');
  } else {
    if (input.template.activeWeekdayCount < 1) {
      reasons.push('no_weekdays');
    }
    if (input.template.activeSectionCount < 1) {
      reasons.push('no_sections');
    }
  }

  if (input.upcomingSessionCount < 1) {
    reasons.push('no_sessions');
  }

  return {
    isBookable: reasons.length === 0,
    reasons,
  };
}

export function templateSnapshotFromVenueConfig(
  config: {
    reservationTimezone: string | null;
    reservationEventTemplate: {
      scheduleMode: ReservationEventScheduleMode;
      timezone: string;
      weekdays: Array<{ isActive: boolean }>;
      classSections: Array<{ isActive: boolean }>;
    } | null;
  } | null,
): ClassEventTemplateSnapshot | null {
  const template = config?.reservationEventTemplate;
  if (!template) return null;

  return {
    scheduleMode: template.scheduleMode,
    timezone:
      template.timezone?.trim() ||
      config?.reservationTimezone?.trim() ||
      'America/New_York',
    activeWeekdayCount: template.weekdays.filter((w) => w.isActive).length,
    activeSectionCount: template.classSections.filter((s) => s.isActive).length,
  };
}

export function templateSnapshotFromPublicSchedule(
  schedule: {
    mode: string;
    timezone: string;
    days?: Array<{ sections: unknown[] }>;
  } | null,
): ClassEventTemplateSnapshot | null {
  if (!schedule || schedule.mode !== 'RECURRING_WEEKLY') return null;

  const days = schedule.days ?? [];
  const sectionCount = days.reduce(
    (total, day) => total + day.sections.length,
    0,
  );

  return {
    scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
    timezone: schedule.timezone?.trim() || 'America/New_York',
    activeWeekdayCount: days.length,
    activeSectionCount: sectionCount,
  };
}

export function countBookableUpcomingSessions(
  sessions: Array<{ endsAt: string | Date; seatsRemaining: number }>,
  now: Date = new Date(),
): number {
  return sessions.filter((session) => {
    const endsAt =
      session.endsAt instanceof Date
        ? session.endsAt
        : new Date(session.endsAt);
    return endsAt > now && session.seatsRemaining > 0;
  }).length;
}
