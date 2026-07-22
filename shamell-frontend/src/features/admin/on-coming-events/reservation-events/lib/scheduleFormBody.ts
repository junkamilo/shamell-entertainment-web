import type { ScheduleFormState } from "../components/ReservationEventScheduleSections";
import type { ReservationEventTemplateBody } from "../types/reservationEventTemplate.types";

/** Converts the inline schedule form into a reservation event template payload. */
export function scheduleFormToTemplateBody(
  name: string,
  schedule: ScheduleFormState,
): ReservationEventTemplateBody {
  const base = {
    name: name.trim(),
    timezone: "America/New_York",
    scheduleMode: schedule.scheduleMode,
  };
  if (schedule.scheduleMode === "FIXED_EVENT") {
    return {
      ...base,
      salesStartDate: schedule.salesStartDate,
      salesEndDate: schedule.salesEndDate,
      eventDate: schedule.eventDate,
      eventStartTime: schedule.eventStartTime,
      eventEndTime: schedule.eventEndTime,
    };
  }
  return {
    ...base,
    weekdays: schedule.weekdays,
    recurringStartTime: schedule.recurringStartTime,
    recurringEndTime: schedule.recurringEndTime,
    classSections: schedule.classSections.map((s) => ({
      weekday: s.weekday,
      label: s.label.trim(),
      startTime: s.startTime,
      endTime: s.endTime,
      sortOrder: s.sortOrder,
      defaultCapacity: Number.parseInt(s.defaultCapacity, 10),
      defaultPrice: Number.parseFloat(s.defaultPrice),
    })),
  };
}
