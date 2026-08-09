import { ReservationEventScheduleMode } from '@prisma/client';
import type { CreateReservationEventTemplateDto } from '../dto/create-reservation-event-template.dto';
import type {
  TemplateWithWeekdays,
  ValidatedTemplatePayload,
} from '../types/reservation-event-templates.types';

const NOW = new Date('2026-08-09T12:00:00.000Z');

export function makeWeekdays(active: number[] = [1, 3, 5]) {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isActive: active.includes(weekday),
  }));
}

export function makeFixedCreateDto(
  overrides: Partial<CreateReservationEventTemplateDto> = {},
): CreateReservationEventTemplateDto {
  return {
    name: 'Gala Night',
    timezone: 'America/New_York',
    scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
    salesStartDate: '2026-09-01',
    salesEndDate: '2026-09-20',
    eventDate: '2026-09-25',
    eventStartTime: '19:00',
    eventEndTime: '22:00',
    ...overrides,
  };
}

export function makeRecurringCreateDto(
  overrides: Partial<CreateReservationEventTemplateDto> = {},
): CreateReservationEventTemplateDto {
  return {
    name: 'Weekly Classes',
    timezone: 'America/New_York',
    scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
    weekdays: makeWeekdays([1]),
    classSections: [
      {
        weekday: 1,
        label: 'Beginner',
        startTime: '18:00',
        endTime: '19:00',
        sortOrder: 0,
        defaultCapacity: 12,
        defaultPrice: 25,
        isActive: true,
      },
    ],
    ...overrides,
  };
}

export function makeValidatedFixedPayload(
  overrides: Partial<ValidatedTemplatePayload> = {},
): ValidatedTemplatePayload {
  return {
    name: 'Gala Night',
    timezone: 'America/New_York',
    scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
    salesStartDate: new Date('2026-09-01T12:00:00.000Z'),
    salesEndDate: new Date('2026-09-20T12:00:00.000Z'),
    eventDate: new Date('2026-09-25T12:00:00.000Z'),
    eventStartTime: '19:00',
    eventEndTime: '22:00',
    recurringEffectiveFrom: null,
    recurringStartTime: null,
    recurringEndTime: null,
    weekdays: makeWeekdays([]).map((w) => ({ ...w, isActive: false })),
    classSections: [],
    ...overrides,
  };
}

export function makeTemplateRow(
  overrides: Partial<TemplateWithWeekdays> = {},
): TemplateWithWeekdays {
  return {
    id: 'tmpl-1',
    name: 'Gala Night',
    timezone: 'America/New_York',
    scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
    salesStartDate: new Date('2026-09-01T12:00:00.000Z'),
    salesEndDate: new Date('2026-09-20T12:00:00.000Z'),
    eventDate: new Date('2026-09-25T12:00:00.000Z'),
    eventStartTime: '19:00',
    eventEndTime: '22:00',
    recurringEffectiveFrom: null,
    recurringStartTime: null,
    recurringEndTime: null,
    startDate: new Date('2026-09-01T12:00:00.000Z'),
    endDate: new Date('2026-09-20T12:00:00.000Z'),
    startTime: '19:00',
    endTime: '22:00',
    createdAt: NOW,
    updatedAt: NOW,
    weekdays: makeWeekdays([]).map((w, i) => ({
      id: `wd-${i}`,
      templateId: 'tmpl-1',
      weekday: w.weekday,
      isActive: false,
    })),
    classSections: [],
    venueConfigs: [],
    ...overrides,
  };
}

export function makeRecurringTemplateRow(
  overrides: Partial<TemplateWithWeekdays> = {},
): TemplateWithWeekdays {
  const weekdays = makeWeekdays([1]).map((w, i) => ({
    id: `wd-${i}`,
    templateId: 'tmpl-2',
    weekday: w.weekday,
    isActive: w.isActive,
  }));
  return makeTemplateRow({
    id: 'tmpl-2',
    name: 'Weekly Classes',
    scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
    salesStartDate: null,
    salesEndDate: null,
    eventDate: null,
    eventStartTime: null,
    eventEndTime: null,
    recurringEffectiveFrom: new Date('2026-08-09T12:00:00.000Z'),
    recurringStartTime: '18:00',
    recurringEndTime: '19:00',
    startDate: new Date('2026-08-09T12:00:00.000Z'),
    endDate: new Date('2026-08-09T12:00:00.000Z'),
    startTime: '18:00',
    endTime: '19:00',
    weekdays,
    classSections: [
      {
        id: 'sec-1',
        templateId: 'tmpl-2',
        weekday: 1,
        label: 'Beginner',
        startTime: '18:00',
        endTime: '19:00',
        sortOrder: 0,
        defaultCapacity: 12,
        defaultPrice:
          25 as unknown as TemplateWithWeekdays['classSections'][0]['defaultPrice'],
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    ...overrides,
  });
}
