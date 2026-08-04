import { vi } from "vitest";
import {
  makeAdminBookingRow,
  makeContactRequest,
  makeServiceByInquiryCode,
} from "../fixtures/agendaLib.fixture";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
  FIXTURE_SERVICE_ID,
} from "../fixtures/uuids.fixture";

export function createMockAgendaBookingDisplayState(
  overrides: Record<string, unknown> = {},
) {
  return {
    booking: makeAdminBookingRow(),
    serviceLine: "Private Gala · Host",
    chip: "PRIVATE GALA +1",
    ...overrides,
  };
}

export function createMockPeticionesNotificationState(
  overrides: Record<string, unknown> = {},
) {
  return {
    bookingsLastSeenAt: 0,
    guidanceLastSeenAt: 0,
    privateClassesLastSeenAt: 0,
    notify: vi.fn(),
    ...overrides,
  };
}

export function createMockContactBookingBridgeState(
  overrides: Record<string, unknown> = {},
) {
  return {
    contact: makeContactRequest(),
    booking: makeAdminBookingRow({ id: FIXTURE_BOOKING_ID }),
    serviceByInquiryCode: makeServiceByInquiryCode(),
    contactId: FIXTURE_CONTACT_ID,
    serviceId: FIXTURE_SERVICE_ID,
    ...overrides,
  };
}
