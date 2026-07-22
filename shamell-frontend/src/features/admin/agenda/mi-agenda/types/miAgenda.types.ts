import type { AdminBookingRow } from "@/hooks/use-admin-bookings";

export type ViewMode = "day" | "week" | "month";

export type CalendarRange = {
  fromIso: string;
  toIso: string;
};

export type EnrichedBooking = AdminBookingRow & {
  dateIso: string;
  start: string;
  end: string;
  startM: number;
  durationM: number;
};
