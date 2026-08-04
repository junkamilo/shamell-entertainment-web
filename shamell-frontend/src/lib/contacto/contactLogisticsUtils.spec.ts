import { afterEach, describe, expect, it, vi } from "vitest";
import {
  firstSelectableMinuteParts,
  format12hPeriodHint,
  formatDateDisplayUs,
  formatMinutesAsTimeDisplayUs,
  formatPartsDisplayUs,
  formatTimeDisplayUs,
  hhmmToMinutes,
  hhmmToParts,
  isTimeSlotSelectable,
  minutesFromParts,
  parseISOLocal,
  partsToHHMM,
  snapToNearestSelectableParts,
  startOfTodayLocal,
  toISOLocalDate,
} from "./contactLogisticsUtils";

describe("contactLogisticsUtils dates", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses and formats local ISO dates", () => {
    expect(parseISOLocal("2026-08-15")).toEqual(new Date(2026, 7, 15));
    expect(parseISOLocal("2026-02-30")).toBeNull();
    expect(parseISOLocal("nope")).toBeNull();
    expect(toISOLocalDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(formatDateDisplayUs("2026-08-15")).toMatch(/Aug/);
    expect(formatDateDisplayUs("bad")).toBe("");
  });

  it("returns start of today in local time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 21, 15, 45, 0));
    const today = startOfTodayLocal();
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
    expect(toISOLocalDate(today)).toBe("2026-07-21");
  });
});

describe("contactLogisticsUtils times", () => {
  it("converts HH:mm and 12h parts", () => {
    expect(hhmmToMinutes("14:30")).toBe(870);
    expect(hhmmToMinutes("25:00")).toBeNull();
    expect(hhmmToParts("00:05")).toEqual({ h12: 12, min: 5, ap: "AM" });
    expect(hhmmToParts("12:00")).toEqual({ h12: 12, min: 0, ap: "PM" });
    expect(partsToHHMM(12, 0, "AM")).toBe("00:00");
    expect(partsToHHMM(12, 0, "PM")).toBe("12:00");
    expect(partsToHHMM(1, 5, "PM")).toBe("13:05");
    expect(minutesFromParts(2, 0, "AM")).toBe(120);
  });

  it("formats US display labels and noon/midnight hints", () => {
    expect(formatPartsDisplayUs(12, 0, "PM")).toBe("12:00 PM");
    expect(formatTimeDisplayUs("13:05")).toBe("1:05 PM");
    expect(formatTimeDisplayUs("bad")).toBe("");
    expect(formatMinutesAsTimeDisplayUs(0)).toBe("12:00 AM");
    expect(format12hPeriodHint(12, "AM")).toBe("Midnight");
    expect(format12hPeriodHint(12, "PM")).toBe("Noon");
    expect(format12hPeriodHint(11, "AM")).toBeNull();
  });

  it("clamps selectable slots and snaps to the first available", () => {
    const clamp = { minMinutes: 10 * 60, maxMinutes: 12 * 60 };
    const blocked = [{ startMinutes: 10 * 60, endMinutes: 10 * 60 + 30 }];

    expect(isTimeSlotSelectable(11, 0, "AM", clamp, blocked)).toBe(true);
    expect(isTimeSlotSelectable(10, 15, "AM", clamp, blocked)).toBe(false);
    expect(isTimeSlotSelectable(1, 0, "PM", clamp)).toBe(false);

    expect(firstSelectableMinuteParts(clamp, blocked)).toEqual({
      h12: 10,
      min: 31,
      ap: "AM",
    });
    expect(snapToNearestSelectableParts(10, 10, "AM", clamp, blocked)).toEqual({
      h12: 10,
      min: 31,
      ap: "AM",
    });
    expect(snapToNearestSelectableParts(11, 0, "AM", clamp, blocked)).toEqual({
      h12: 11,
      min: 0,
      ap: "AM",
    });
  });
});
