import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "./uuids.fixture";

export function makeAdminBookingRow(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: FIXTURE_BOOKING_ID,
    eventDate: "2026-07-15T22:00:00.000Z",
    location: "Garden Terrace",
    status: "PENDING",
    source: "ADMIN",
    guestFullName: "Maria Garcia",
    guestEmail: "maria@example.com",
    guestPhone: "5559876543",
    guestCount: 80,
    notes: "Anniversary",
    eventType: { id: FIXTURE_EVENT_TYPE_ID, name: "Wedding" },
    occasionType: { id: FIXTURE_OCCASION_ID, name: "Reception" },
    bookingDetails: {
      eventTimeStart: "18:30",
      eventTimeEnd: "22:30",
    },
    contactRequestId: FIXTURE_CONTACT_ID,
    ...overrides,
  };
}

export function makeMultiServiceBookingRow(): AdminBookingRow {
  return makeAdminBookingRow({
    bookingServices: [
      { serviceId: FIXTURE_SERVICE_ID_2, sortOrder: 1, service: { id: FIXTURE_SERVICE_ID_2 } },
      { serviceId: FIXTURE_SERVICE_ID, sortOrder: 0, service: { id: FIXTURE_SERVICE_ID } },
    ],
    service: { id: FIXTURE_SERVICE_ID },
  });
}
