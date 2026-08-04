import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addDaysISO,
  bookingWeekdayFromIsoDate,
  expandBlockedDateReasonsMap,
  expandBlockedDates,
  isoDateInTzNow,
  timeBoundsForDateISO,
  utcInstantForWallClock,
} from "./bookingAvailability";
import {
  makeClosure,
  makePublicAvailabilityRules,
  makeWeeklySlot,
} from "./test/fixtures/contactoLib.fixture";
import { FIXTURE_BOOKING_TZ } from "./test/fixtures/uuids.fixture";

describe("bookingAvailability", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("adds civil days and resolves weekdays in a timezone", () => {
    expect(addDaysISO("2030-01-31", 1)).toBe("2030-02-01");
    // 2030-01-15 is a Tuesday (2) in America/New_York
    expect(bookingWeekdayFromIsoDate("2030-01-15", FIXTURE_BOOKING_TZ)).toBe(2);
  });

  it("returns today's ISO date in the booking timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-06-01T16:00:00.000Z"));
    expect(isoDateInTzNow(FIXTURE_BOOKING_TZ)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("expands blocked dates from closures and closed weekdays", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-10T12:00:00.000Z"));

    const rules = makePublicAvailabilityRules({
      closures: [
        makeClosure({ kind: "SPECIFIC_DATE", date: "2030-01-12", note: "Closed for private event" }),
        makeClosure({
          kind: "RECURRING_WEEKDAY",
          date: null,
          weekday: 0,
          note: "Sundays off",
        }),
        makeClosure({
          kind: "DATE_RANGE",
          date: null,
          weekday: null,
          startDate: "2030-01-20",
          endDate: "2030-01-21",
          note: "Maintenance",
        }),
      ],
      weekly: Array.from({ length: 7 }, (_, weekday) =>
        makeWeeklySlot({
          weekday,
          isClosed: weekday === 2,
          startTime: weekday === 2 ? null : "09:00",
          endTime: weekday === 2 ? null : "17:00",
        }),
      ),
    });

    const blocked = expandBlockedDates(
      rules.timeZone,
      rules.weekly,
      rules.closures,
      20,
    );
    expect(blocked.has("2030-01-12")).toBe(true);
    expect(blocked.has("2030-01-20")).toBe(true);

    const reasons = expandBlockedDateReasonsMap(
      rules.timeZone,
      rules.weekly,
      rules.closures,
      20,
    );
    expect(reasons.get("2030-01-12")).toMatch(/private event|not available/i);
  });

  it("returns weekly time bounds for open days", () => {
    const weekly = Array.from({ length: 7 }, (_, weekday) =>
      makeWeeklySlot({ weekday }),
    );
    // Monday 2030-01-14
    const bounds = timeBoundsForDateISO("2030-01-14", FIXTURE_BOOKING_TZ, weekly);
    expect(bounds).toEqual({ minMinutes: 10 * 60, maxMinutes: 18 * 60 });

    const closed = timeBoundsForDateISO(
      "2030-01-14",
      FIXTURE_BOOKING_TZ,
      weekly.map((w) => (w.weekday === 1 ? { ...w, isClosed: true } : w)),
    );
    expect(closed).toBeUndefined();
  });

  it("converts wall-clock minutes to a UTC instant", () => {
    const instant = utcInstantForWallClock("2030-01-15", 14 * 60, FIXTURE_BOOKING_TZ);
    expect(instant).toBeInstanceOf(Date);
    expect(Number.isNaN(instant.getTime())).toBe(false);

    expect(() =>
      utcInstantForWallClock("bad", 0, FIXTURE_BOOKING_TZ),
    ).toThrow(/Invalid calendar date/i);
  });
});
