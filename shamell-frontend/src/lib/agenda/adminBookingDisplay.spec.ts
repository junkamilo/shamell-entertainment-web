import { describe, expect, it } from "vitest";
import { makeAdminBookingRow } from "./test/fixtures/agendaLib.fixture";
import {
  bookingServiceChip,
  bookingServiceDisplayLine,
} from "./adminBookingDisplay";

describe("bookingServiceDisplayLine", () => {
  it("returns empty for nullish rows", () => {
    expect(bookingServiceDisplayLine(null)).toBe("");
    expect(bookingServiceDisplayLine(undefined)).toBe("");
  });

  it("joins serviceLabels from bookingDetails", () => {
    const row = makeAdminBookingRow({
      bookingDetails: { serviceLabels: ["Private Gala", "Host"] },
    });
    expect(bookingServiceDisplayLine(row)).toBe("Private Gala · Host");
  });

  it("falls back to service type name", () => {
    const row = makeAdminBookingRow({
      bookingDetails: null,
      service: { id: "x", serviceType: { name: " VIP Event " } },
    });
    expect(bookingServiceDisplayLine(row)).toBe("VIP Event");
  });
});

describe("bookingServiceChip", () => {
  it("shows +N when there are multiple labels", () => {
    const row = makeAdminBookingRow({
      bookingDetails: { serviceLabels: ["Private Gala Night", "Host"] },
    });
    expect(bookingServiceChip(row)).toBe("PRIVATE GALA N +1");
  });

  it("uppercases a single label", () => {
    const row = makeAdminBookingRow({
      bookingDetails: { serviceLabels: ["Host"] },
    });
    expect(bookingServiceChip(row)).toBe("HOST");
  });

  it("falls back to service type or BOOKING", () => {
    expect(
      bookingServiceChip(
        makeAdminBookingRow({
          bookingDetails: {},
          service: { id: "x", serviceType: { name: "Gala" } },
        }),
      ),
    ).toBe("GALA");
    expect(
      bookingServiceChip(
        makeAdminBookingRow({
          bookingDetails: null,
          service: undefined,
        }),
      ),
    ).toBe("BOOKING");
  });
});
