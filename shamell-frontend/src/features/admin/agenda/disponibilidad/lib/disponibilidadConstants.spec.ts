import { describe, it, expect } from "vitest";
import {
  WEEKDAY_LABEL,
  CLOSURE_KIND_OPTIONS,
  CLOSURE_WEEKDAY_OPTIONS,
  defaultWeekly,
} from "./disponibilidadConstants";

describe("disponibilidadConstants", () => {
  describe("WEEKDAY_LABEL", () => {
    it("has 7 entries ordered Sunday through Saturday", () => {
      expect(WEEKDAY_LABEL).toHaveLength(7);
      expect(WEEKDAY_LABEL).toEqual([
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]);
    });
  });

  describe("CLOSURE_KIND_OPTIONS", () => {
    it("has the three closure kinds with ids and labels", () => {
      expect(CLOSURE_KIND_OPTIONS).toEqual([
        { id: "SPECIFIC_DATE", label: "Single date" },
        { id: "DATE_RANGE", label: "Date range (from / through)" },
        { id: "RECURRING_WEEKDAY", label: "Weekly (e.g. every Sunday)" },
      ]);
    });
  });

  describe("CLOSURE_WEEKDAY_OPTIONS", () => {
    it("has 7 options with stringified index ids and weekday labels", () => {
      expect(CLOSURE_WEEKDAY_OPTIONS).toHaveLength(7);
      expect(CLOSURE_WEEKDAY_OPTIONS).toEqual(
        WEEKDAY_LABEL.map((label, i) => ({ id: String(i), label })),
      );
      expect(CLOSURE_WEEKDAY_OPTIONS[0]).toEqual({ id: "0", label: "Sunday" });
      expect(CLOSURE_WEEKDAY_OPTIONS[6]).toEqual({ id: "6", label: "Saturday" });
    });
  });

  describe("defaultWeekly", () => {
    it("returns 7 slots", () => {
      expect(defaultWeekly()).toHaveLength(7);
    });

    it("closes Sunday with null start/end times", () => {
      const sunday = defaultWeekly().find((s) => s.weekday === 0);
      expect(sunday).toEqual({
        weekday: 0,
        isClosed: true,
        startTime: null,
        endTime: null,
      });
    });

    it("opens Monday through Saturday from 09:00 to 21:00", () => {
      const rest = defaultWeekly().filter((s) => s.weekday !== 0);
      expect(rest).toHaveLength(6);
      for (const slot of rest) {
        expect(slot.isClosed).toBe(false);
        expect(slot.startTime).toBe("09:00");
        expect(slot.endTime).toBe("21:00");
      }
    });

    it("returns a fresh array each call (no shared mutable state)", () => {
      const a = defaultWeekly();
      const b = defaultWeekly();
      expect(a).not.toBe(b);
      expect(a).toEqual(b);
    });
  });
});
