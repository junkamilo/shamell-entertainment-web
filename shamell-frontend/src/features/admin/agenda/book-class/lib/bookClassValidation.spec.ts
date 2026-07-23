import { describe, it, expect } from "vitest";
import { makeBookClassFormSnapshot } from "../test/fixtures/bookClass.fixture";
import {
  FIXTURE_SESSION_ID,
  FIXTURE_SESSION_ID_2,
} from "../test/fixtures/uuids.fixture";
import { resolvePurchaseKind, validateBookClassForm } from "./bookClassValidation";

describe("validateBookClassForm", () => {
  it("accepts a valid day booking", () => {
    expect(validateBookClassForm(makeBookClassFormSnapshot(), true)).toBeNull();
  });

  it("requires an event", () => {
    expect(
      validateBookClassForm(makeBookClassFormSnapshot({ eventId: "  " }), true),
    ).toBe("Select a class event.");
  });

  it("requires name and email", () => {
    expect(
      validateBookClassForm(
        makeBookClassFormSnapshot({ customerName: "", customerEmail: "" }),
        true,
      ),
    ).toBe("Name and email are required.");
  });

  it("requires cash confirmation for cash payments", () => {
    expect(
      validateBookClassForm(
        makeBookClassFormSnapshot({
          paymentMethod: "cash",
          cashConfirmed: false,
        }),
        true,
      ),
    ).toBe("Confirm that cash payment was received.");
  });

  it("requires class day and sections for day bookings", () => {
    expect(
      validateBookClassForm(
        makeBookClassFormSnapshot({ weekday: null, selectedDateIso: null }),
        true,
      ),
    ).toBe("Select a class day.");

    expect(
      validateBookClassForm(
        makeBookClassFormSnapshot({ selectedSessionIds: new Set() }),
        true,
      ),
    ).toBe("Select at least one class section.");
  });

  it("validates month package availability", () => {
    const monthForm = makeBookClassFormSnapshot({
      bookingKind: "month",
      monthIso: "2030-03",
      weekday: null,
      selectedDateIso: null,
      selectedSessionIds: new Set(),
    });

    expect(validateBookClassForm(monthForm, true)).toBeNull();
    expect(validateBookClassForm(monthForm, false)).toBe(
      "Month package is not available for this event.",
    );
    expect(
      validateBookClassForm({ ...monthForm, monthIso: null }, true),
    ).toBe("Month package is not available for this event.");
  });
});

describe("resolvePurchaseKind", () => {
  it("returns month_package for month bookings", () => {
    expect(
      resolvePurchaseKind(
        makeBookClassFormSnapshot({ bookingKind: "month", monthIso: "2030-03" }),
      ),
    ).toBe("month_package");
  });

  it("returns session for a single selected section", () => {
    expect(
      resolvePurchaseKind(
        makeBookClassFormSnapshot({
          selectedSessionIds: new Set([FIXTURE_SESSION_ID]),
        }),
      ),
    ).toBe("session");
  });

  it("returns day_bundle for multiple sections", () => {
    expect(
      resolvePurchaseKind(
        makeBookClassFormSnapshot({
          selectedSessionIds: new Set([FIXTURE_SESSION_ID, FIXTURE_SESSION_ID_2]),
        }),
      ),
    ).toBe("day_bundle");
  });
});
