import type { PublicClosure, PublicWeeklySlot } from "@/lib/bookingAvailability";

export type AdminAvailabilitySnapshot = {
  timeZone: string;
  weekly: (PublicWeeklySlot & { id: string; updatedAt: string })[];
  closures: (PublicClosure & { id: string; note: string | null; createdAt: string })[];
};

export type ClosureKind = "SPECIFIC_DATE" | "RECURRING_WEEKDAY" | "DATE_RANGE";

export type ActivePanel = "weekly" | "closures";

export type TimePickerTarget = { weekday: number; field: "start" | "end" };

export type ClosureDatePickerTarget = "single" | "start" | "end";

export type CreateClosurePayload = {
  kind: ClosureKind;
  date?: string;
  weekday?: number;
  startDate?: string;
  endDate?: string;
  note?: string;
};
