import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_TYPE_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "./uuids.fixture";

export function makeAdminBookingRow(
  overrides: Partial<AdminBookingRow> = {},
): AdminBookingRow {
  return {
    id: FIXTURE_BOOKING_ID,
    eventDate: "2026-08-15T18:00:00.000Z",
    location: "Studio A",
    status: "PENDING",
    source: "ADMIN_FROM_CONTACT",
    guestFullName: "Ada Guest",
    guestEmail: "ada@example.com",
    guestPhone: "555-0100",
    guestCount: 20,
    service: {
      id: FIXTURE_SERVICE_ID,
      serviceType: { name: "Private Gala" },
    },
    eventType: { id: FIXTURE_EVENT_TYPE_ID, name: "Gala" },
    occasionType: { id: FIXTURE_OCCASION_TYPE_ID, name: "Wedding" },
    event: { id: FIXTURE_EVENT_ID, name: "Summer Night" },
    bookingDetails: {
      eventTimeStart: "14:00",
      eventTimeEnd: "16:00",
      serviceLabels: ["Private Gala", "Host"],
    },
    ...overrides,
  };
}

export function makeContactRequest(
  overrides: Partial<ContactRequest> = {},
): ContactRequest {
  return {
    id: FIXTURE_CONTACT_ID,
    fullName: "Ada Guest",
    email: "ada@example.com",
    phone: "555-0100",
    eventDate: "2026-08-15",
    location: "Miami Ballroom",
    serviceType: "PRIVATE_GALA",
    preferences: null,
    subject: "Wedding inquiry — PRIVATE_GALA",
    message: `Structured summary${"\n\n---\n\n"}Please confirm lighting.`,
    inquiryDetails: {
      eventTimeStart: "14:00",
      eventTimeEnd: "16:00",
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      occasionTypeId: FIXTURE_OCCASION_TYPE_ID,
      eventId: FIXTURE_EVENT_ID,
      guestCount: 40,
      serviceIds: [FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2],
      eventAddress: "100 Ocean Drive",
    },
    conciergeVisionSnapshot: null,
    isRead: false,
    status: "PENDING",
    createdAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

export function makeServiceByInquiryCode(
  entries: Array<[string, string]> = [["PRIVATE_GALA", FIXTURE_SERVICE_ID]],
) {
  return new Map(entries);
}
