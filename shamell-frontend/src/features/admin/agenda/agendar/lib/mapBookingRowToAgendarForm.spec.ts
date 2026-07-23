import { describe, expect, it } from "vitest";
import { applyBookingRowToAgendarForm } from "./mapBookingRowToAgendarForm";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { makeAdminBookingRow, makeMultiServiceBookingRow } from "../tests/fixtures/bookingRow.fixture";
import {
  FIXTURE_CONTACT_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "../tests/fixtures/uuids.fixture";

const TZ = "America/New_York";

describe("applyBookingRowToAgendarForm", () => {
  it("maps booking row fields into form setters", () => {
    const form = createMockAgendarFormState();
    const row = makeAdminBookingRow({
      service: { id: FIXTURE_SERVICE_ID },
    });

    applyBookingRowToAgendarForm(row, form, TZ);

    expect(form.setServiceIds).toHaveBeenCalledWith([FIXTURE_SERVICE_ID]);
    expect(form.setEventTypeId).toHaveBeenCalledWith(FIXTURE_EVENT_TYPE_ID);
    expect(form.setOccasionTypeId).toHaveBeenCalledWith(FIXTURE_OCCASION_ID);
    expect(form.setEventDateIso).toHaveBeenCalledWith("2026-07-15");
    expect(form.setEventTimeStart).toHaveBeenCalledWith("18:30");
    expect(form.setEventTimeEnd).toHaveBeenCalledWith("22:30");
    expect(form.setLocation).toHaveBeenCalledWith("Garden Terrace");
    expect(form.setGuestFullName).toHaveBeenCalledWith("Maria Garcia");
    expect(form.setGuestEmail).toHaveBeenCalledWith("maria@example.com");
    expect(form.setGuestPhone).toHaveBeenCalledWith("5559876543");
    expect(form.setGuestCount).toHaveBeenCalledWith("80");
    expect(form.setNotes).toHaveBeenCalledWith("Anniversary");
    expect(form.setLinkedContactRequestId).toHaveBeenCalledWith(FIXTURE_CONTACT_ID);
  });

  it("uses bookingServices sorted by sortOrder when present", () => {
    const form = createMockAgendarFormState();
    applyBookingRowToAgendarForm(makeMultiServiceBookingRow(), form, TZ);
    expect(form.setServiceIds).toHaveBeenCalledWith([FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2]);
  });

  it("reads serviceIds from bookingDetails when bookingServices is empty", () => {
    const form = createMockAgendarFormState();
    const row = makeAdminBookingRow({
      bookingServices: undefined,
      service: undefined,
      bookingDetails: {
        serviceIds: [FIXTURE_SERVICE_ID_2, FIXTURE_SERVICE_ID],
      },
    });

    applyBookingRowToAgendarForm(row, form, TZ);
    expect(form.setServiceIds).toHaveBeenCalledWith([FIXTURE_SERVICE_ID_2, FIXTURE_SERVICE_ID]);
  });

  it("prefers user fullName/email over guest fields", () => {
    const form = createMockAgendarFormState();
    const row = makeAdminBookingRow({
      service: { id: FIXTURE_SERVICE_ID },
      user: { fullName: "User Name", email: "User@Example.COM" },
      guestFullName: "Guest Name",
      guestEmail: "guest@example.com",
    });

    applyBookingRowToAgendarForm(row, form, TZ);
    expect(form.setGuestFullName).toHaveBeenCalledWith("User Name");
    expect(form.setGuestEmail).toHaveBeenCalledWith("user@example.com");
  });
});
