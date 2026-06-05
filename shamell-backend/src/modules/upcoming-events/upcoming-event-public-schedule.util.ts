import {
  ReservationEventScheduleMode,
  type ReservationEventClassSection,
  type ReservationEventTemplate,
  type ReservationEventWeekday,
} from '@prisma/client';
import { buildTemplateSummary } from '../reservation-event-templates/reservation-event-template.util';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isoDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export type PublicClassSectionDisplay = {
  id: string;
  label: string | null;
  startTime: string;
  endTime: string;
  sortOrder: number;
};

export type PublicRecurringDayDisplay = {
  weekday: number;
  label: string;
  sections: PublicClassSectionDisplay[];
};

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
      days: PublicRecurringDayDisplay[];
    };

export function buildPublicScheduleDisplay(
  template: ReservationEventTemplate & {
    weekdays?: ReservationEventWeekday[];
    classSections?: ReservationEventClassSection[];
  },
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

  const activeWeekdays =
    template.weekdays?.filter((w) => w.isActive).map((w) => w.weekday) ?? [];
  const weekdayLabels = activeWeekdays.map(
    (w) => WEEKDAY_LABELS[w] ?? String(w),
  );

  const sectionsByDay = new Map<number, PublicClassSectionDisplay[]>();
  for (const s of template.classSections ?? []) {
    if (!s.isActive || !activeWeekdays.includes(s.weekday)) continue;
    const list = sectionsByDay.get(s.weekday) ?? [];
    list.push({
      id: s.id,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      sortOrder: s.sortOrder,
    });
    sectionsByDay.set(s.weekday, list);
  }

  const days: PublicRecurringDayDisplay[] = activeWeekdays
    .sort((a, b) => a - b)
    .map((weekday) => ({
      weekday,
      label: WEEKDAY_LABELS[weekday] ?? String(weekday),
      sections: (sectionsByDay.get(weekday) ?? []).sort(
        (a, b) => a.sortOrder - b.sortOrder,
      ),
    }));

  return {
    mode: 'RECURRING_WEEKLY',
    timezone,
    summary,
    effectiveFrom: isoDate(template.recurringEffectiveFrom),
    weekdayLabels,
    startTime: template.recurringStartTime,
    endTime: template.recurringEndTime,
    days,
  };
}
