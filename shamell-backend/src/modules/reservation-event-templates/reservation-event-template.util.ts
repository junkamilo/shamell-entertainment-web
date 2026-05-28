import { BadRequestException } from '@nestjs/common';
import {
  ReservationEventScheduleMode,
  UpcomingClassVariant,
  UpcomingExperienceType,
  type ReservationEventTemplate,
  type ReservationEventWeekday,
} from '@prisma/client';

const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type WeekdayInput = { weekday: number; isActive: boolean };

export type ValidatedTemplatePayload = {
  name: string;
  timezone: string;
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate: Date | null;
  salesEndDate: Date | null;
  eventDate: Date | null;
  eventStartTime: string | null;
  eventEndTime: string | null;
  recurringEffectiveFrom: Date | null;
  recurringStartTime: string | null;
  recurringEndTime: string | null;
  weekdays: WeekdayInput[];
};

export function parseHHMM(value: string, field: string): { h: number; m: number } {
  const trimmed = value.trim();
  const match = HHMM_RE.exec(trimmed);
  if (!match) {
    throw new BadRequestException(`${field} must be HH:mm (24h).`);
  }
  return { h: Number(match[1]), m: Number(match[2]) };
}

export function parseISODateOnly(value: string, field: string): Date {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new BadRequestException(`${field} must be YYYY-MM-DD.`);
  }
  const d = new Date(`${trimmed}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`Invalid ${field}.`);
  }
  return d;
}

export function todayISODateInTimezone(timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export function combineDateAndTime(date: Date, time: string): Date {
  const { h, m } = parseHHMM(time, 'time');
  const iso = date.toISOString().slice(0, 10);
  const combined = new Date(
    `${iso}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`,
  );
  if (Number.isNaN(combined.getTime())) {
    throw new BadRequestException('Could not combine date and time.');
  }
  return combined;
}

export function endOfDay(date: Date): Date {
  const iso = date.toISOString().slice(0, 10);
  return new Date(`${iso}T23:59:59.000`);
}

export function assertDateNotBeforeToday(
  date: Date,
  field: string,
  timezone: string,
): void {
  const today = todayISODateInTimezone(timezone);
  const iso = date.toISOString().slice(0, 10);
  if (iso < today) {
    throw new BadRequestException(`${field} cannot be in the past.`);
  }
}

export function validateWeekdaysActive(weekdays: WeekdayInput[]): void {
  if (!Array.isArray(weekdays) || weekdays.length !== 7) {
    throw new BadRequestException('weekdays must include 7 entries (0–6).');
  }
  const seen = new Set<number>();
  for (const row of weekdays) {
    if (!Number.isInteger(row.weekday) || row.weekday < 0 || row.weekday > 6) {
      throw new BadRequestException('weekday must be 0–6.');
    }
    if (seen.has(row.weekday)) {
      throw new BadRequestException('Duplicate weekday in weekdays.');
    }
    seen.add(row.weekday);
  }
  if (!weekdays.some((w) => w.isActive)) {
    throw new BadRequestException('At least one weekday must be active.');
  }
}

export function inactiveWeekdays(): WeekdayInput[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, isActive: false }));
}

export function validateTemplatePayload(input: {
  name: string;
  timezone?: string;
  scheduleMode: ReservationEventScheduleMode;
  salesStartDate?: string;
  salesEndDate?: string;
  eventDate?: string;
  eventStartTime?: string;
  eventEndTime?: string;
  recurringStartTime?: string;
  recurringEndTime?: string;
  weekdays?: WeekdayInput[];
}): ValidatedTemplatePayload {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 120) {
    throw new BadRequestException('name must be 2–120 characters.');
  }

  const timezone = input.timezone?.trim() || 'America/New_York';
  const scheduleMode = input.scheduleMode;

  if (scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
    if (!input.salesStartDate || !input.salesEndDate) {
      throw new BadRequestException(
        'salesStartDate and salesEndDate are required for fixed events.',
      );
    }
    if (!input.eventDate || !input.eventStartTime || !input.eventEndTime) {
      throw new BadRequestException(
        'eventDate, eventStartTime, and eventEndTime are required for fixed events.',
      );
    }

    const salesStartDate = parseISODateOnly(input.salesStartDate, 'salesStartDate');
    const salesEndDate = parseISODateOnly(input.salesEndDate, 'salesEndDate');
    const eventDate = parseISODateOnly(input.eventDate, 'eventDate');

    assertDateNotBeforeToday(salesStartDate, 'salesStartDate', timezone);
    assertDateNotBeforeToday(salesEndDate, 'salesEndDate', timezone);
    assertDateNotBeforeToday(eventDate, 'eventDate', timezone);

    if (salesEndDate.getTime() < salesStartDate.getTime()) {
      throw new BadRequestException('salesEndDate must be on or after salesStartDate.');
    }

    const salesStartIso = salesStartDate.toISOString().slice(0, 10);
    const salesEndIso = salesEndDate.toISOString().slice(0, 10);
    const eventIso = eventDate.toISOString().slice(0, 10);
    if (eventIso < salesStartIso || eventIso > salesEndIso) {
      throw new BadRequestException(
        'eventDate should fall within the sales window.',
      );
    }

    const eventStartTime = input.eventStartTime.trim();
    const eventEndTime = input.eventEndTime.trim();
    const startMins =
      parseHHMM(eventStartTime, 'eventStartTime').h * 60 +
      parseHHMM(eventStartTime, 'eventStartTime').m;
    const endMins =
      parseHHMM(eventEndTime, 'eventEndTime').h * 60 +
      parseHHMM(eventEndTime, 'eventEndTime').m;
    if (endMins <= startMins) {
      throw new BadRequestException('eventEndTime must be after eventStartTime.');
    }

    return {
      name,
      timezone,
      scheduleMode,
      salesStartDate,
      salesEndDate,
      eventDate,
      eventStartTime,
      eventEndTime,
      recurringEffectiveFrom: null,
      recurringStartTime: null,
      recurringEndTime: null,
      weekdays: inactiveWeekdays(),
    };
  }

  if (!input.weekdays) {
    throw new BadRequestException('weekdays are required for recurring schedules.');
  }
  if (!input.recurringStartTime || !input.recurringEndTime) {
    throw new BadRequestException(
      'recurringStartTime and recurringEndTime are required for recurring schedules.',
    );
  }

  validateWeekdaysActive(input.weekdays);

  const recurringStartTime = input.recurringStartTime.trim();
  const recurringEndTime = input.recurringEndTime.trim();
  const startMins =
    parseHHMM(recurringStartTime, 'recurringStartTime').h * 60 +
    parseHHMM(recurringStartTime, 'recurringStartTime').m;
  const endMins =
    parseHHMM(recurringEndTime, 'recurringEndTime').h * 60 +
    parseHHMM(recurringEndTime, 'recurringEndTime').m;
  if (endMins <= startMins) {
    throw new BadRequestException(
      'recurringEndTime must be after recurringStartTime.',
    );
  }

  const todayIso = todayISODateInTimezone(timezone);
  const recurringEffectiveFrom = parseISODateOnly(todayIso, 'recurringEffectiveFrom');

  return {
    name,
    timezone,
    scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
    salesStartDate: null,
    salesEndDate: null,
    eventDate: null,
    eventStartTime: null,
    eventEndTime: null,
    recurringEffectiveFrom,
    recurringStartTime,
    recurringEndTime,
    weekdays: input.weekdays,
  };
}

export function experienceFromScheduleMode(
  scheduleMode: ReservationEventScheduleMode,
): {
  experienceType: UpcomingExperienceType;
  classVariant: UpcomingClassVariant | null;
} {
  if (scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
    return {
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      classVariant: null,
    };
  }
  return {
    experienceType: UpcomingExperienceType.CLASSES,
    classVariant: UpcomingClassVariant.GROUP,
  };
}

export type TemplateForDerive = Pick<
  ReservationEventTemplate,
  | 'name'
  | 'timezone'
  | 'scheduleMode'
  | 'salesStartDate'
  | 'salesEndDate'
  | 'eventDate'
  | 'eventStartTime'
  | 'eventEndTime'
  | 'recurringEffectiveFrom'
  | 'recurringStartTime'
  | 'recurringEndTime'
>;

/** Copies template schedule into UpcomingVenueConfig reservation fields (phase-1 window). */
export function deriveVenueConfigFromTemplate(template: TemplateForDerive): {
  reservationEventLabel: string;
  reservationTimezone: string;
  reservationOpensAt: Date;
  reservationClosesAt: Date;
  reservationEventDate: Date;
} {
  if (template.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
    if (
      !template.salesStartDate ||
      !template.salesEndDate ||
      !template.eventDate ||
      !template.eventStartTime ||
      !template.eventEndTime
    ) {
      throw new BadRequestException('Fixed event template is incomplete.');
    }
    const opensAt = combineDateAndTime(template.salesStartDate, '00:00');
    const closesAt = endOfDay(template.salesEndDate);
    const reservationEventDate = combineDateAndTime(
      template.eventDate,
      template.eventStartTime,
    );
    if (closesAt.getTime() <= opensAt.getTime()) {
      throw new BadRequestException('Sales window end must be after start.');
    }
    return {
      reservationEventLabel: template.name,
      reservationTimezone: template.timezone,
      reservationOpensAt: opensAt,
      reservationClosesAt: closesAt,
      reservationEventDate,
    };
  }

  if (
    !template.recurringEffectiveFrom ||
    !template.recurringStartTime ||
    !template.recurringEndTime
  ) {
    throw new BadRequestException('Recurring template is incomplete.');
  }

  const opensAt = combineDateAndTime(
    template.recurringEffectiveFrom,
    template.recurringStartTime,
  );
  const year = template.recurringEffectiveFrom.getUTCFullYear() + 1;
  const closesAt = endOfDay(
    new Date(`${year}-12-31T12:00:00.000Z`),
  );

  return {
    reservationEventLabel: template.name,
    reservationTimezone: template.timezone,
    reservationOpensAt: opensAt,
    reservationClosesAt: closesAt,
    reservationEventDate: opensAt,
  };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function buildTemplateSummary(
  row: TemplateForDerive & { weekdays?: ReservationEventWeekday[] },
): string {
  if (row.scheduleMode === ReservationEventScheduleMode.FIXED_EVENT) {
    const sales =
      row.salesStartDate && row.salesEndDate ?
        `Sales ${row.salesStartDate.toISOString().slice(0, 10)}–${row.salesEndDate.toISOString().slice(0, 10)}`
      : '';
    const event =
      row.eventDate && row.eventStartTime && row.eventEndTime ?
        `Event ${row.eventDate.toISOString().slice(0, 10)} · ${row.eventStartTime}–${row.eventEndTime}`
      : '';
    return [sales, event].filter(Boolean).join(' · ') || 'Fixed event';
  }

  const active =
    row.weekdays
      ?.filter((w) => w.isActive)
      .map((w) => WEEKDAY_LABELS[w.weekday] ?? String(w.weekday)) ?? [];
  const from =
    row.recurringEffectiveFrom ?
      `From ${row.recurringEffectiveFrom.toISOString().slice(0, 10)}`
    : 'From today';
  const times =
    row.recurringStartTime && row.recurringEndTime ?
      `${row.recurringStartTime}–${row.recurringEndTime}`
    : '';
  return [from, active.join(', '), times].filter(Boolean).join(' · ');
}
