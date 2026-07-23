import type { AdminBookingRow } from "@/hooks/use-admin-bookings";
import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { UnifiedPeticionRow } from "../../types/peticiones.types";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_BOOKING_ID_2,
  FIXTURE_CONTACT_ID,
  FIXTURE_CONTACT_ID_2,
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_SERVICE_ID,
} from "./uuids.fixture";

export function makeContactRequest(
  overrides: Partial<ContactRequest> = {},
): ContactRequest {
  return {
    id: FIXTURE_CONTACT_ID,
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: "555-0100",
    eventDate: "2026-08-15",
    location: "Studio A",
    serviceType: null,
    preferences: null,
    subject: "Birthday show inquiry",
    message: "Looking for a private show.",
    inquiryDetails: null,
    conciergeVisionSnapshot: null,
    isRead: false,
    status: "PENDING",
    createdAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  } as ContactRequest;
}

export function makeAdminBookingRow(
  overrides: Partial<AdminBookingRow> = {},
): AdminBookingRow {
  return {
    id: FIXTURE_BOOKING_ID,
    createdAt: "2026-07-20T12:00:00.000Z",
    contactRequestId: null,
    eventDate: "2026-08-15T20:00:00.000Z",
    location: "Studio A",
    status: "PENDING",
    source: "ADMIN_PHONE",
    notes: "Bring shoes",
    bookingDetails: null,
    guestFullName: "Ada Guest",
    guestEmail: "ada@example.com",
    guestPhone: "555-0100",
    guestCount: 2,
    user: null,
    service: {
      id: FIXTURE_SERVICE_ID,
      serviceType: { name: "Performance" },
    },
    eventType: { id: FIXTURE_EVENT_TYPE_ID, name: "Private event" },
    occasionType: null,
    event: { id: "ev-1", name: "Gala night" },
    quoteModel: null,
    quoteTotalAmount: null,
    quoteDepositAmount: null,
    quoteBalanceAmount: null,
    quoteSentAt: null,
    depositPaidAt: null,
    balancePaidAt: null,
    ...overrides,
  } as AdminBookingRow;
}

export function makeContactRow(
  overrides: Partial<Extract<UnifiedPeticionRow, { origin: "CONTACT" }>> = {},
): Extract<UnifiedPeticionRow, { origin: "CONTACT" }> {
  const contact = overrides.contact ?? makeContactRequest();
  return {
    origin: "CONTACT",
    id: contact.id,
    createdAt: contact.createdAt,
    state: contact.status ?? "PENDING",
    hasLinkedBooking: false,
    contact,
    ...overrides,
  };
}

export function makeBookingRow(
  overrides: Partial<
    Extract<UnifiedPeticionRow, { origin: "BOOKING_ADMIN" }>
  > = {},
): Extract<UnifiedPeticionRow, { origin: "BOOKING_ADMIN" }> {
  const booking = overrides.booking ?? makeAdminBookingRow();
  return {
    origin: "BOOKING_ADMIN",
    id: booking.id,
    createdAt: booking.createdAt ?? "2026-07-20T12:00:00.000Z",
    status: booking.status,
    booking,
    linkedContact: null,
    ...overrides,
  };
}

export function makePeticionesList(
  items: UnifiedPeticionRow[] = [
    makeContactRow(),
    makeBookingRow({
      booking: makeAdminBookingRow({
        id: FIXTURE_BOOKING_ID_2,
        guestFullName: "Guest Two",
        guestEmail: "two@example.com",
      }),
      id: FIXTURE_BOOKING_ID_2,
    }),
  ],
) {
  return {
    items,
    meta: {
      page: 1,
      perPage: 10,
      totalItems: items.length,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
  };
}

export function makeCatalogServicesPayload() {
  return [
    {
      id: FIXTURE_SERVICE_ID,
      contactInquiryCode: "SHOW",
      isActive: true,
    },
  ];
}

export function makeCatalogEventTypesPayload() {
  return [
    {
      id: FIXTURE_EVENT_TYPE_ID,
      contactInquiryCode: "PRIVATE",
      isActive: true,
    },
  ];
}

export function makeCatalogContactLinesPayload() {
  return [
    {
      id: FIXTURE_CONTACT_LINE_ID,
      contactInquiryCode: "GUIDANCE",
    },
  ];
}

export { FIXTURE_CONTACT_ID_2 };
