import { describe, expect, it } from "vitest";
import {
  formatDurationFromMinutes,
  formatOccurrenceDate,
  parseScheduleViewModel,
  weekdayLabelsToIndices,
} from "./parseScheduleViewModel";
import { makeRecurringSchedule } from "../test/fixtures/onComingEvents.fixture";
import type { OnComingEventSchedule } from "../services/fetchOnComingEventDetail";

describe("weekdayLabelsToIndices", () => {
  it("maps weekday labels to sorted indices", () => {
    expect(weekdayLabelsToIndices(["Wed", "Mon"])).toEqual([1, 3]);
  });

  it("ignores unknown labels", () => {
    expect(weekdayLabelsToIndices(["Foo", "Mon"])).toEqual([1]);
  });
});

describe("formatDurationFromMinutes", () => {
  it("formats hours and minutes", () => {
    expect(formatDurationFromMinutes(90)).toBe("1h 30m");
    expect(formatDurationFromMinutes(60)).toBe("1h");
    expect(formatDurationFromMinutes(45)).toBe("45m");
  });
});

describe("parseScheduleViewModel", () => {
  it("returns null for null schedule", () => {
    expect(parseScheduleViewModel(null)).toBeNull();
  });

  it("parses recurring weekly schedule", () => {
    const vm = parseScheduleViewModel(makeRecurringSchedule());
    expect(vm?.mode).toBe("RECURRING_WEEKLY");
    expect(vm?.activeWeekdays).toEqual([1]);
    expect(vm?.daySummaries).toHaveLength(1);
    expect(vm?.timeArcs.length).toBeGreaterThan(0);
    expect(vm?.humanLines.some((line) => line.includes("Weekly"))).toBe(true);
  });

  it("parses fixed event schedule", () => {
    const schedule: OnComingEventSchedule = {
      mode: "FIXED_EVENT",
      timezone: "America/New_York",
      summary: "Gala night",
      salesWindow: { start: "2030-07-01", end: "2030-07-31" },
      eventDate: "2030-08-01",
      startTime: "19:00",
      endTime: "22:00",
    };
    const vm = parseScheduleViewModel(schedule);
    expect(vm?.mode).toBe("FIXED_EVENT");
    expect(vm?.eventDate).toBe("2030-08-01");
    expect(vm?.durationTotalMinutes).toBe(180);
    expect(vm?.humanLines.some((line) => line.includes("Ticket sales"))).toBe(true);
  });
});

describe("formatOccurrenceDate", () => {
  it("formats iso date for display", () => {
    expect(formatOccurrenceDate("2030-08-04")).toMatch(/Aug/);
  });

  it("returns original string when iso is invalid", () => {
    expect(formatOccurrenceDate("not-a-date")).toBe("not-a-date");
  });
});
