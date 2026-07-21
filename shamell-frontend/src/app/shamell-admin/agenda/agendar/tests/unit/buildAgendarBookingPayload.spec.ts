import { describe, expect, it } from "vitest";
import { buildAgendarBookingPayload } from "../../lib/buildAgendarBookingPayload";
import { validAgendarFormValues } from "../fixtures/formValues.fixture";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
  FIXTURE_SERVICE_ID_2,
} from "../fixtures/uuids.fixture";

describe("buildAgendarBookingPayload", () => {
  const normalized = {
    ...validAgendarFormValues,
    guestCount: 120,
    serviceId: FIXTURE_SERVICE_ID,
    serviceIds: [FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2],
  };

  it("builds create payload with bookingDetails and status PENDING", () => {
    const eventDateIso = "2026-08-15T22:00:00.000Z";
    const payload = buildAgendarBookingPayload(normalized, eventDateIso);

    expect(payload).toEqual({
      serviceId: FIXTURE_SERVICE_ID,
      eventDate: eventDateIso,
      location: "Main Hall",
      eventTypeId: FIXTURE_EVENT_TYPE_ID,
      occasionTypeId: FIXTURE_OCCASION_ID,
      guestFullName: "Jane Doe",
      guestEmail: "jane@example.com",
      guestPhone: "+1 (555) 123-4567",
      guestCount: 120,
      notes: "VIP table near stage",
      status: "PENDING",
      bookingDetails: {
        eventTimeStart: "18:00",
        eventTimeEnd: "20:00",
        serviceIds: [FIXTURE_SERVICE_ID, FIXTURE_SERVICE_ID_2],
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        occasionTypeId: FIXTURE_OCCASION_ID,
        guestCount: 120,
      },
    });
  });

  it("omits notes when empty", () => {
    const payload = buildAgendarBookingPayload(
      { ...normalized, notes: "" },
      "2026-08-15T22:00:00.000Z",
    );
    expect(payload.notes).toBeUndefined();
  });
});
