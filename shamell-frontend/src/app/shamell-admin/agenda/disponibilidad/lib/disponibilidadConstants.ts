import type { AdminAccordionSingleOption } from "@/components/admin/AdminAccordionSingleSelect";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";

export const WEEKDAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const CLOSURE_KIND_OPTIONS: AdminAccordionSingleOption[] = [
  { id: "SPECIFIC_DATE", label: "Single date" },
  { id: "DATE_RANGE", label: "Date range (from / through)" },
  { id: "RECURRING_WEEKDAY", label: "Weekly (e.g. every Sunday)" },
];

export const CLOSURE_WEEKDAY_OPTIONS: AdminAccordionSingleOption[] = WEEKDAY_LABEL.map(
  (label, i) => ({
    id: String(i),
    label,
  }),
);

export function defaultWeekly(): PublicWeeklySlot[] {
  return [0, 1, 2, 3, 4, 5, 6].map((weekday) =>
    weekday === 0
      ? { weekday, isClosed: true, startTime: null, endTime: null }
      : { weekday, isClosed: false, startTime: "09:00", endTime: "21:00" },
  );
}
