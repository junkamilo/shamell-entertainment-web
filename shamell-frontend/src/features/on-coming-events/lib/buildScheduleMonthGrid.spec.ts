import { describe, expect, it, vi } from "vitest";
import {
  buildScheduleMonthGrid,
  getNextOccurrence,
  getNextOccurrenceAfter,
  monthLabel,
  parseMonthFromAnchor,
  weekdayHeaders,
} from "./buildScheduleMonthGrid";

describe("weekdayHeaders", () => {
  it("returns Sun through Sat", () => {
    expect(weekdayHeaders()).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });
});

describe("buildScheduleMonthGrid", () => {
  it("marks recurring weekdays after anchor date", () => {
    const grid = buildScheduleMonthGrid({
      year: 2030,
      month: 7,
      mode: "RECURRING_WEEKLY",
      activeWeekdays: [1],
      anchorDate: "2030-08-04",
    });
    const mondaysInMonth = grid.cells.filter(
      (cell) => cell.inMonth && cell.iso.startsWith("2030-08") && cell.isRecurringDay,
    );
    expect(mondaysInMonth.length).toBeGreaterThan(0);
    expect(mondaysInMonth.every((cell) => cell.iso >= "2030-08-04")).toBe(true);
  });

  it("marks fixed event day and sales range", () => {
    const grid = buildScheduleMonthGrid({
      year: 2030,
      month: 7,
      mode: "FIXED_EVENT",
      eventDate: "2030-08-15",
      salesWindow: { start: "2030-08-01", end: "2030-08-14" },
    });
    const eventCell = grid.cells.find((cell) => cell.iso === "2030-08-15");
    const salesCell = grid.cells.find((cell) => cell.iso === "2030-08-10");
    expect(eventCell?.isEventDay).toBe(true);
    expect(eventCell?.inSalesRange).toBe(false);
    expect(salesCell?.inSalesRange).toBe(true);
  });

  it("produces 42 cells spanning six weeks", () => {
    const grid = buildScheduleMonthGrid({
      year: 2030,
      month: 7,
      mode: "RECURRING_WEEKLY",
      activeWeekdays: [1],
    });
    expect(grid.cells).toHaveLength(42);
  });
});

describe("monthLabel", () => {
  it("formats month and year", () => {
    expect(monthLabel(2030, 7)).toBe("August 2030");
  });
});

describe("getNextOccurrence", () => {
  it("returns next matching weekday on or after fromIso", () => {
    expect(getNextOccurrence([1], "2030-08-05")).toBe("2030-08-05");
    expect(getNextOccurrence([1], "2030-08-06")).toBe("2030-08-12");
  });

  it("returns null when no weekdays configured", () => {
    expect(getNextOccurrence([], "2030-08-04")).toBeNull();
  });
});

describe("getNextOccurrenceAfter", () => {
  it("returns the next occurrence strictly after a date", () => {
    expect(getNextOccurrenceAfter([1], "2030-08-05")).toBe("2030-08-12");
  });
});

describe("parseMonthFromAnchor", () => {
  it("parses year and month from anchor date", () => {
    expect(parseMonthFromAnchor("2030-08-15")).toEqual({ year: 2030, month: 7 });
  });

  it("falls back to current month when anchor is invalid", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-09-10T12:00:00.000Z"));
    expect(parseMonthFromAnchor(null)).toEqual({ year: 2030, month: 8 });
    vi.useRealTimers();
  });
});
