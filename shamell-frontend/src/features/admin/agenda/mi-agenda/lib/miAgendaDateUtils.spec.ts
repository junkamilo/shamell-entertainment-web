import { afterEach, describe, expect, it } from "vitest";
import {
  addDaysIso,
  bookingTimeZone,
  mondayStartIso,
  monthEndIso,
  monthStartIso,
  shiftAnchor,
} from "./miAgendaDateUtils";

describe("miAgendaDateUtils", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BOOKING_TZ;
  });

  it("defaults bookingTimeZone to America/New_York", () => {
    delete process.env.NEXT_PUBLIC_BOOKING_TZ;
    expect(bookingTimeZone()).toBe("America/New_York");
  });

  it("adds days on ISO dates", () => {
    expect(addDaysIso("2026-07-20", 6)).toBe("2026-07-26");
    expect(addDaysIso("2026-07-31", 1)).toBe("2026-08-01");
  });

  it("finds Monday start for midweek and Sunday", () => {
    expect(mondayStartIso("2026-07-22")).toBe("2026-07-20"); // Wed
    expect(mondayStartIso("2026-07-26")).toBe("2026-07-20"); // Sun
  });

  it("computes month start and end", () => {
    expect(monthStartIso("2026-07-22")).toBe("2026-07-01");
    expect(monthEndIso("2026-07-22")).toBe("2026-07-31");
    expect(monthEndIso("2024-02-10")).toBe("2024-02-29");
  });

  it("shifts anchors by view mode", () => {
    expect(shiftAnchor("2026-07-22", "day", 1)).toBe("2026-07-23");
    expect(shiftAnchor("2026-07-22", "week", -1)).toBe("2026-07-15");
    expect(shiftAnchor("2026-01-31", "month", 1)).toBe("2026-03-03");
  });
});
