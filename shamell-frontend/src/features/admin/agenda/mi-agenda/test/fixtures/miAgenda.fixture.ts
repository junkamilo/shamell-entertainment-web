import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import type { EnrichedBooking } from "../../types/miAgenda.types";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_BOOKING_ID_2,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_SERVICE_ID,
} from "./uuids.fixture";

export function makeAdminBookingRow(
  overrides: Partial<AdminBookingRow> = {},
): AdminBookingRow {
  return {
    id: FIXTURE_BOOKING_ID,
    eventDate: "2026-07-22T14:00:00.000Z",
    location: "Studio A",
    status: "CONFIRMED",
    source: "ADMIN_PHONE",
    notes: "Bring shoes",
    guestFullName: "Ada Guest",
    guestEmail: "ada@example.com",
    guestPhone: "555-0100",
    guestCount: 2,
    user: null,
    service: {
      id: FIXTURE_SERVICE_ID,
      serviceType: { name: "Performance" },
    },
    eventType: { id: FIXTURE_EVENT_TYPE_ID, name: "Private class" },
    occasionType: null,
    event: null,
    bookingDetails: {
      eventTimeStart: "10:00",
      eventTimeEnd: "11:30",
    },
    depositPaidAt: null,
    balancePaidAt: null,
    quoteSentAt: null,
    quoteModel: null,
    ...overrides,
  } as AdminBookingRow;
}

export function makeEnrichedBooking(
  overrides: Partial<EnrichedBooking> = {},
): EnrichedBooking {
  const base = makeAdminBookingRow(overrides);
  return {
    ...base,
    dateIso: "2026-07-22",
    start: "10:00",
    end: "11:30",
    startM: 600,
    durationM: 90,
    ...overrides,
  };
}

export function makeEnrichedBookingsForDay(dateIso: string, count = 2): EnrichedBooking[] {
  return Array.from({ length: count }, (_, i) =>
    makeEnrichedBooking({
      id: i === 0 ? FIXTURE_BOOKING_ID : FIXTURE_BOOKING_ID_2,
      dateIso,
      start: `${String(10 + i).padStart(2, "0")}:00`,
      end: `${String(11 + i).padStart(2, "0")}:00`,
      startM: (10 + i) * 60,
      durationM: 60,
      guestFullName: `Guest ${i + 1}`,
    }),
  );
}

export function makeByDateMap(
  entries: Array<[string, EnrichedBooking[]]>,
): Map<string, EnrichedBooking[]> {
  return new Map(entries);
}
