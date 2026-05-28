import {
  ReservationEventScheduleMode,
  type ReservationEventTemplate,
  type ReservationEventWeekday,
} from '@prisma/client';
import { buildTemplateSummary } from '../reservation-event-templates/reservation-event-template.util';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export type PublicScheduleDisplay =
  | {
      mode: 'FIXED_EVENT';
      timezone: string;
      summary: string;
      salesWindow: { start: string; end: string } | null;
      eventDate: string | null;
      startTime: string | null;
      endTime: string | null;
    }
  | {
      mode: 'RECURRING_WEEKLY';
      timezone: string;
      summary: string;
      effectiveFrom: string | null;
      weekdayLabels: string[];
      startTime: string | null;
      endTime: string | null;
    };

export function buildPublicScheduleDisplay(
  template: ReservationEventTemplate & { weekdays?: ReservationEventWeekday[] },
): PublicScheduleDisplay {
  const timezone = template.timezone;
  const summary = buildTemplateSummary(template);

  if (template.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
    const salesStart = isoDate(template.salesStartDate);
    const salesEnd = isoDate(template.salesEndDate);
    return {
      mode: 'FIXED_EVENT',
      timezone,
      summary,
      salesWindow:
        salesStart && salesEnd ? { start: salesStart, end: salesEnd } : null,
      eventDate: isoDate(template.eventDate),
      startTime: template.eventStartTime,
      endTime: template.eventEndTime,
    };
  }

  const weekdayLabels =
    template.weekdays
      ?.filter((w) => w.isActive)
      .map((w) => WEEKDAY_LABELS[w.weekday] ?? String(w.weekday)) ?? [];

  return {
    mode: 'RECURRING_WEEKLY',
    timezone,
    summary,
    effectiveFrom: isoDate(template.recurringEffectiveFrom),
    weekdayLabels,
    startTime: template.recurringStartTime,
    endTime: template.recurringEndTime,
  };
}
