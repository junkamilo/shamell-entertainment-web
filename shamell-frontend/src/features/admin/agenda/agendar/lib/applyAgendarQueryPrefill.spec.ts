import { describe, expect, it } from "vitest";
import { applyAgendarQueryPrefill } from "./applyAgendarQueryPrefill";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { mockSearchParams } from "../tests/helpers/mockSearchParams";
import {
  FIXTURE_CONTACT_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "../tests/fixtures/uuids.fixture";

describe("applyAgendarQueryPrefill", () => {
  it("prefills guest and logistics fields from query params", () => {
    const form = createMockAgendarFormState();
    const params = mockSearchParams({
      fullName: "John9 Smith",
      email: "John@Example.COM",
      phone: "+1-555-0000",
      eventDate: "2026-09-01",
      location: "  Rooftop  ",
      start: "19:00",
      end: "21:00",
      message: "Please call ahead",
      guestCount: "45",
    });

    applyAgendarQueryPrefill(params, form);

    expect(form.setGuestFullName).toHaveBeenCalledWith("John Smith");
    expect(form.setGuestEmail).toHaveBeenCalledWith("john@example.com");
    expect(form.setGuestPhone).toHaveBeenCalledWith("+1-555-0000");
    expect(form.setEventDateIso).toHaveBeenCalledWith("2026-09-01");
    expect(form.setLocation).toHaveBeenCalledWith("Rooftop");
    expect(form.setEventTimeStart).toHaveBeenCalledWith("19:00");
    expect(form.setEventTimeEnd).toHaveBeenCalledWith("21:00");
    expect(form.setNotes).toHaveBeenCalledWith("Please call ahead");
    expect(form.setGuestCount).toHaveBeenCalledWith("45");
  });

  it("prefills multiple serviceIds from CSV", () => {
    const form = createMockAgendarFormState();
    const params = mockSearchParams({
      serviceIds: `${FIXTURE_SERVICE_ID},${FIXTURE_SERVICE_ID_2}`,
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      occasionTypeId: FIXTURE_OCCASION_ID,
    });

    applyAgendarQueryPrefill(params, form);

    expect(form.setServiceIds).toHaveBeenCalledWith([FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2]);
    expect(form.setEventTypeId).toHaveBeenCalledWith(FIXTURE_EVENT_TYPE_ID);
    expect(form.setOccasionTypeId).toHaveBeenCalledWith(FIXTURE_OCCASION_ID);
  });

  it("falls back to single serviceId when serviceIds is absent", () => {
    const form = createMockAgendarFormState();
    applyAgendarQueryPrefill(mockSearchParams({ serviceId: FIXTURE_SERVICE_ID }), form);
    expect(form.setServiceIds).toHaveBeenCalledWith([FIXTURE_SERVICE_ID]);
  });

  it("ignores invalid UUIDs in serviceIds and contactId", () => {
    const form = createMockAgendarFormState();
    applyAgendarQueryPrefill(
      mockSearchParams({
        serviceIds: "bad-id,also-bad",
        contactId: "not-uuid",
      }),
      form,
    );
    expect(form.setServiceIds).not.toHaveBeenCalled();
    expect(form.setLinkedContactRequestId).toHaveBeenCalledWith("");
  });

  it("sets linked contact request when contactId is valid", () => {
    const form = createMockAgendarFormState();
    applyAgendarQueryPrefill(mockSearchParams({ contactId: FIXTURE_CONTACT_ID }), form);
    expect(form.setLinkedContactRequestId).toHaveBeenCalledWith(FIXTURE_CONTACT_ID);
  });

  it("ignores malformed date and time query values", () => {
    const form = createMockAgendarFormState();
    applyAgendarQueryPrefill(
      mockSearchParams({
        eventDate: "09/01/2026",
        start: "7pm",
        end: "21",
      }),
      form,
    );
    expect(form.setEventDateIso).not.toHaveBeenCalled();
    expect(form.setEventTimeStart).not.toHaveBeenCalled();
    expect(form.setEventTimeEnd).not.toHaveBeenCalled();
  });
});
