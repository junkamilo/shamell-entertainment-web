import { WEEKDAY_LABELS } from '../constants/reservation-event-templates.constants';
import type {
  AdminTemplateResponse,
  TemplateWithWeekdays,
} from '../types/reservation-event-templates.types';
import { buildTemplateSummary } from './reservation-event-template.util';

export function mapTemplate(row: TemplateWithWeekdays): AdminTemplateResponse {
  const activeDays = row.weekdays
    .filter((w) => w.isActive)
    .map((w) => WEEKDAY_LABELS[w.weekday] ?? String(w.weekday));
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    scheduleMode: row.scheduleMode,
    salesStartDate: row.salesStartDate?.toISOString().slice(0, 10) ?? null,
    salesEndDate: row.salesEndDate?.toISOString().slice(0, 10) ?? null,
    eventDate: row.eventDate?.toISOString().slice(0, 10) ?? null,
    eventStartTime: row.eventStartTime,
    eventEndTime: row.eventEndTime,
    recurringEffectiveFrom:
      row.recurringEffectiveFrom?.toISOString().slice(0, 10) ?? null,
    recurringStartTime: row.recurringStartTime,
    recurringEndTime: row.recurringEndTime,
    startDate: row.startDate?.toISOString().slice(0, 10) ?? null,
    endDate: row.endDate?.toISOString().slice(0, 10) ?? null,
    startTime: row.startTime,
    endTime: row.endTime,
    weekdays: row.weekdays.map((w) => ({
      weekday: w.weekday,
      isActive: w.isActive,
    })),
    classSections: row.classSections.map((s) => ({
      id: s.id,
      weekday: s.weekday,
      label: s.label,
      startTime: s.startTime,
      endTime: s.endTime,
      sortOrder: s.sortOrder,
      defaultCapacity: s.defaultCapacity,
      defaultPrice: s.defaultPrice != null ? Number(s.defaultPrice) : null,
      isActive: s.isActive,
    })),
    activeDayLabels: activeDays,
    summary: buildTemplateSummary(row),
    linkedEventIds: row.venueConfigs.map((config) => config.eventId),
    updatedAt: row.updatedAt.toISOString(),
  };
}
