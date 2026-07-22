import type { ReservationEventWeekday } from "../types/reservationEventTemplate.types";

export function todayIsoDateInTimezone(timezone = "America/New_York"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function defaultReservationWeekdays(): ReservationEventWeekday[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    isActive: weekday >= 1 && weekday <= 5,
  }));
}
