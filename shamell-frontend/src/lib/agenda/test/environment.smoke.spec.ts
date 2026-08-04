/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeAdminBookingRow,
  makeContactRequest,
  makeServiceByInquiryCode,
} from "./fixtures/agendaLib.fixture";
import {
  FIXTURE_BOOKING_ID,
  FIXTURE_CONTACT_ID,
  FIXTURE_SERVICE_ID,
} from "./fixtures/uuids.fixture";
import { createMockAgendaBookingDisplayState } from "./helpers/mockAgendaLib";
import { bookingServiceDisplayLine } from "../adminBookingDisplay";
import { formatContactSubjectForAdmin } from "../adminContactDisplay";

describe("agenda lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeAdminBookingRow().id).toBe(FIXTURE_BOOKING_ID);
    expect(makeContactRequest().id).toBe(FIXTURE_CONTACT_ID);
    expect(makeServiceByInquiryCode().get("PRIVATE_GALA")).toBe(
      FIXTURE_SERVICE_ID,
    );

    const state = createMockAgendaBookingDisplayState();
    expect(state.booking.id).toBe(FIXTURE_BOOKING_ID);
    expect(
      bookingServiceDisplayLine(state.booking as never),
    ).toContain("Private Gala");
  });

  it("keeps display helpers wired for smoke", () => {
    expect(formatContactSubjectForAdmin("Reservation inquiry")).toBe(
      "Consulta de reserva",
    );
    expect(formatContactSubjectForAdmin("Wedding — PRIVATE_GALA")).toBe(
      "Wedding",
    );
  });
});
