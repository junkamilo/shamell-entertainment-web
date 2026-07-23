import { afterEach, describe, expect, it } from "vitest";
import {
  bookingTimeZone,
  formatEventCalendarDate,
  formatRequestDate,
  isoDateFromInstantInTimeZone,
} from "./peticionesDateUtils";

describe("peticionesDateUtils", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BOOKING_TZ;
  });

  it("formats request dates and falls back on invalid input", () => {
    const formatted = formatRequestDate("2026-08-15T14:00:00.000Z");
    expect(formatted.length).toBeGreaterThan(0);
    expect(formatRequestDate("not-a-date")).toBe("not-a-date");
  });

  it("formats YMD event calendar dates", () => {
    expect(formatEventCalendarDate("2026-08-15")).toMatch(/Aug/);
    expect(formatEventCalendarDate("oops").length).toBeGreaterThan(0);
  });

  it("converts instants to ISO dates in a timezone", () => {
    expect(
      isoDateFromInstantInTimeZone("2026-08-15T04:00:00.000Z", "America/New_York"),
    ).toBe("2026-08-15");
  });

  it("defaults bookingTimeZone", () => {
    delete process.env.NEXT_PUBLIC_BOOKING_TZ;
    expect(bookingTimeZone()).toBe("America/New_York");
  });
});
