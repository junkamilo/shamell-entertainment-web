import { describe, expect, it } from "vitest";
import {
  defaultReservationWeekdays,
  todayIsoDateInTimezone,
} from "./reservationEventTemplateDefaults";

describe("reservationEventTemplateDefaults", () => {
  describe("todayIsoDateInTimezone", () => {
    it("returns an ISO date string in YYYY-MM-DD format", () => {
      const result = todayIsoDateInTimezone("America/New_York");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("respects the provided timezone", () => {
      const ny = todayIsoDateInTimezone("America/New_York");
      const utc = todayIsoDateInTimezone("UTC");
      expect(typeof ny).toBe("string");
      expect(typeof utc).toBe("string");
    });
  });

  describe("defaultReservationWeekdays", () => {
    it("returns all seven weekdays", () => {
      const weekdays = defaultReservationWeekdays();
      expect(weekdays).toHaveLength(7);
      expect(weekdays.map((w) => w.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it("activates Monday through Friday by default", () => {
      const weekdays = defaultReservationWeekdays();
      expect(weekdays.filter((w) => w.isActive).map((w) => w.weekday)).toEqual([
        1, 2, 3, 4, 5,
      ]);
      expect(weekdays.find((w) => w.weekday === 0)?.isActive).toBe(false);
      expect(weekdays.find((w) => w.weekday === 6)?.isActive).toBe(false);
    });
  });
});
