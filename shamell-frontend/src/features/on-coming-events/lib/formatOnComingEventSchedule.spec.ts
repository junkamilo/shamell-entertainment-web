import { describe, expect, it } from "vitest";
import { formatOnComingEventSchedule } from "./formatOnComingEventSchedule";
import { makeRecurringSchedule } from "../test/fixtures/onComingEvents.fixture";
import type { OnComingEventSchedule } from "../services/fetchOnComingEventDetail";

describe("formatOnComingEventSchedule", () => {
  it("returns null for null schedule", () => {
    expect(formatOnComingEventSchedule(null)).toBeNull();
  });

  it("formats recurring weekly schedule", () => {
    const copy = formatOnComingEventSchedule(makeRecurringSchedule());
    expect(copy?.daysTitle).toBe("Days");
    expect(copy?.weekdayChips).toEqual(["Mon"]);
    expect(copy?.timeRange).toMatch(/7:00 PM/);
    expect(copy?.summary).toBe("Mon · 7:00 PM–8:00 PM");
  });

  it("formats fixed event schedule", () => {
    const schedule: OnComingEventSchedule = {
      mode: "FIXED_EVENT",
      timezone: "America/New_York",
      summary: "Gala night",
      salesWindow: { start: "2030-07-01", end: "2030-07-31" },
      eventDate: "2030-08-01",
      startTime: "19:00",
      endTime: "22:00",
    };
    const copy = formatOnComingEventSchedule(schedule);
    expect(copy?.daysTitle).toBe("Dates");
    expect(copy?.daysLines.some((line) => line.startsWith("Sales:"))).toBe(true);
    expect(copy?.daysLines.some((line) => line.startsWith("Event date:"))).toBe(true);
    expect(copy?.weekdayChips).toEqual([]);
  });
});
