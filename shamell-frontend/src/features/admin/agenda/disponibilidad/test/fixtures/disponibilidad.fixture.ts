import type { PublicWeeklySlot } from "@/lib/bookingAvailability";
import { defaultWeekly } from "../../lib/disponibilidadConstants";
import type {
  AdminAvailabilitySnapshot,
  CreateClosurePayload,
} from "../../types/disponibilidad.types";
import {
  FIXTURE_CLOSURE_RANGE_ID,
  FIXTURE_CLOSURE_RECURRING_ID,
  FIXTURE_CLOSURE_SPECIFIC_ID,
  FIXTURE_WEEKLY_SLOT_IDS,
} from "./uuids.fixture";

const UPDATED_AT = "2030-01-15T12:00:00.000Z";
const CREATED_AT = "2030-01-10T12:00:00.000Z";

export function makeWeeklySlot(
  overrides: Partial<PublicWeeklySlot> & { weekday: number },
): PublicWeeklySlot {
  const base = defaultWeekly().find((s) => s.weekday === overrides.weekday)!;
  return { ...base, ...overrides };
}

export function makeAdminWeeklySlots(
  slots: PublicWeeklySlot[] = defaultWeekly(),
): AdminAvailabilitySnapshot["weekly"] {
  return slots.map((slot, index) => ({
    ...slot,
    id: FIXTURE_WEEKLY_SLOT_IDS[index] ?? FIXTURE_WEEKLY_SLOT_IDS[0],
    updatedAt: UPDATED_AT,
  }));
}

export function makeSpecificClosure(
  overrides: Partial<AdminAvailabilitySnapshot["closures"][number]> = {},
): AdminAvailabilitySnapshot["closures"][number] {
  return {
    id: FIXTURE_CLOSURE_SPECIFIC_ID,
    kind: "SPECIFIC_DATE",
    date: "2030-12-25",
    weekday: null,
    startDate: null,
    endDate: null,
    note: "Holiday",
    createdAt: CREATED_AT,
    ...overrides,
  };
}

export function makeRangeClosure(
  overrides: Partial<AdminAvailabilitySnapshot["closures"][number]> = {},
): AdminAvailabilitySnapshot["closures"][number] {
  return {
    id: FIXTURE_CLOSURE_RANGE_ID,
    kind: "DATE_RANGE",
    date: null,
    weekday: null,
    startDate: "2030-07-01",
    endDate: "2030-07-05",
    note: "Vacation",
    createdAt: CREATED_AT,
    ...overrides,
  };
}

export function makeRecurringClosure(
  overrides: Partial<AdminAvailabilitySnapshot["closures"][number]> = {},
): AdminAvailabilitySnapshot["closures"][number] {
  return {
    id: FIXTURE_CLOSURE_RECURRING_ID,
    kind: "RECURRING_WEEKDAY",
    date: null,
    weekday: 0,
    startDate: null,
    endDate: null,
    note: null,
    createdAt: CREATED_AT,
    ...overrides,
  };
}

export function makeAdminAvailabilitySnapshot(
  overrides: Partial<AdminAvailabilitySnapshot> = {},
): AdminAvailabilitySnapshot {
  return {
    timeZone: "America/New_York",
    weekly: makeAdminWeeklySlots(),
    closures: [
      makeSpecificClosure(),
      makeRangeClosure(),
      makeRecurringClosure(),
    ],
    ...overrides,
  };
}

export function makeCreateClosurePayload(
  overrides: Partial<CreateClosurePayload> = {},
): CreateClosurePayload {
  return {
    kind: "SPECIFIC_DATE",
    date: "2030-12-25",
    note: "Holiday",
    ...overrides,
  };
}
