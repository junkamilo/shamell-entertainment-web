import { describe, expect, it } from "vitest";
import {
  applyBlueprintToWeekdays,
  defaultBlueprint,
  inferBlueprintFromActiveDays,
  sectionsMatchBlueprint,
  sectionsToBlueprint,
  validateBlueprintComplete,
  validateBlueprintOverlapMessage,
} from "./recurringClassSectionsBulk.util";
import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";

function completeBlueprint() {
  return [
    {
      label: "Morning",
      startTime: "10:00",
      endTime: "12:00",
      sortOrder: 0,
      defaultCapacity: "20",
      defaultPrice: "25",
    },
  ];
}

function row(overrides: Partial<ClassSectionFormRow> = {}): ClassSectionFormRow {
  return {
    weekday: 1,
    label: "Morning",
    startTime: "10:00",
    endTime: "12:00",
    sortOrder: 0,
    defaultCapacity: "20",
    defaultPrice: "25",
    ...overrides,
  };
}

describe("recurringClassSectionsBulk.util", () => {
  describe("validateBlueprintOverlapMessage", () => {
    it("returns null for non-overlapping sections", () => {
      expect(
        validateBlueprintOverlapMessage([
          { label: "A", startTime: "10:00", endTime: "11:00", sortOrder: 0, defaultCapacity: "10", defaultPrice: "10" },
          { label: "B", startTime: "11:00", endTime: "12:00", sortOrder: 1, defaultCapacity: "10", defaultPrice: "10" },
        ]),
      ).toBeNull();
    });

    it("detects invalid times", () => {
      expect(
        validateBlueprintOverlapMessage([
          { label: "A", startTime: "bad", endTime: "12:00", sortOrder: 0, defaultCapacity: "10", defaultPrice: "10" },
        ]),
      ).toMatch(/valid start and end times/);
    });

    it("detects overlapping sections", () => {
      expect(
        validateBlueprintOverlapMessage([
          { label: "A", startTime: "10:00", endTime: "12:00", sortOrder: 0, defaultCapacity: "10", defaultPrice: "10" },
          { label: "B", startTime: "11:00", endTime: "13:00", sortOrder: 1, defaultCapacity: "10", defaultPrice: "10" },
        ]),
      ).toMatch(/overlaps/);
    });
  });

  describe("validateBlueprintComplete", () => {
    it("requires at least one section", () => {
      expect(validateBlueprintComplete([])).toMatch(/Add at least one section/);
    });

    it("requires label, capacity, and price", () => {
      expect(validateBlueprintComplete(defaultBlueprint())).toMatch(/label is required/);
      expect(
        validateBlueprintComplete([
          { ...defaultBlueprint()[0]!, label: "Class", defaultCapacity: "", defaultPrice: "" },
        ]),
      ).toMatch(/capacity must be at least 1/);
    });

    it("returns null for a complete blueprint", () => {
      expect(validateBlueprintComplete(completeBlueprint())).toBeNull();
    });
  });

  describe("sectionsToBlueprint and sectionsMatchBlueprint", () => {
    it("strips weekday from rows", () => {
      expect(sectionsToBlueprint([row(), row({ weekday: 3, sortOrder: 1 })])).toEqual([
        completeBlueprint()[0],
        { ...completeBlueprint()[0]!, sortOrder: 1 },
      ]);
    });

    it("compares day sections to blueprint", () => {
      const blueprint = completeBlueprint();
      expect(sectionsMatchBlueprint([row()], blueprint)).toBe(true);
      expect(sectionsMatchBlueprint([row({ label: "Other" })], blueprint)).toBe(false);
    });
  });

  describe("inferBlueprintFromActiveDays", () => {
    it("returns null with fewer than two active days", () => {
      expect(inferBlueprintFromActiveDays([row()], [1])).toBeNull();
    });

    it("infers blueprint when active days match", () => {
      const sections = [row({ weekday: 1 }), row({ weekday: 3 })];
      expect(inferBlueprintFromActiveDays(sections, [1, 3])).toEqual(completeBlueprint());
    });

    it("returns null when days differ", () => {
      const sections = [
        row({ weekday: 1 }),
        row({ weekday: 3, label: "Different" }),
      ];
      expect(inferBlueprintFromActiveDays(sections, [1, 3])).toBeNull();
    });
  });

  describe("applyBlueprintToWeekdays", () => {
    it("fills empty weekdays only in fill_empty mode", () => {
      const result = applyBlueprintToWeekdays([], [1, 3], completeBlueprint(), "fill_empty");
      expect(result.error).toBeNull();
      expect(result.filledWeekdays).toEqual([1, 3]);
      expect(result.sections.filter((s) => s.weekday === 1)).toHaveLength(1);
      expect(result.sections.filter((s) => s.weekday === 3)).toHaveLength(1);
    });

    it("skips configured days in fill_empty mode", () => {
      const existing = [row({ weekday: 1, label: "Existing" })];
      const result = applyBlueprintToWeekdays(existing, [1, 3], completeBlueprint(), "fill_empty");
      expect(result.skippedWeekdays).toEqual([1]);
      expect(result.filledWeekdays).toEqual([3]);
      expect(result.sections.find((s) => s.weekday === 1)?.label).toBe("Existing");
    });

    it("returns validation error for incomplete blueprint", () => {
      const result = applyBlueprintToWeekdays([], [1, 3], defaultBlueprint(), "replace_all");
      expect(result.error).toMatch(/label is required/);
      expect(result.filledWeekdays).toEqual([]);
    });

    it("replaces all active days in replace_all mode", () => {
      const existing = [row({ weekday: 1, label: "Old" }), row({ weekday: 3, label: "Old" })];
      const result = applyBlueprintToWeekdays(existing, [1, 3], completeBlueprint(), "replace_all");
      expect(result.error).toBeNull();
      expect(result.filledWeekdays).toEqual([1, 3]);
      expect(result.sections.every((s) => s.label === "Morning")).toBe(true);
    });
  });
});
