import { describe, expect, it } from "vitest";
import {
  applyBlueprintToWeekdays,
  blockedRangesForSectionTimePick,
  defaultBlueprint,
  inferBlueprintFromActiveDays,
  liveSectionsOverlapMessage,
  sectionsMatchBlueprint,
  sectionsToBlueprint,
  suggestNextSectionTimes,
  validateActiveDaysSectionsNoOverlap,
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

  describe("liveSectionsOverlapMessage", () => {
    it("ignores incomplete times", () => {
      expect(
        liveSectionsOverlapMessage([
          { sortOrder: 0, startTime: "06:00", endTime: "08:00" },
          { sortOrder: 1, startTime: "", endTime: "12:00" },
        ]),
      ).toBeNull();
    });

    it("flags real overlaps only", () => {
      expect(
        liveSectionsOverlapMessage([
          { sortOrder: 0, startTime: "06:00", endTime: "08:00" },
          { sortOrder: 1, startTime: "07:00", endTime: "09:00" },
        ]),
      ).toMatch(/overlaps/);
    });
  });

  describe("blockedRangesForSectionTimePick", () => {
    const sections = [
      { sortOrder: 0, startTime: "06:00", endTime: "08:00" },
      { sortOrder: 1, startTime: "09:00", endTime: "12:00" },
    ];

    it("blocks the other section window when picking start", () => {
      const ranges = blockedRangesForSectionTimePick({
        field: "start",
        editingSortOrder: 1,
        sections,
      });
      // 06:00–08:00 half-open → inclusive 06:00–07:59
      expect(ranges.some((r) => r.startMinutes <= 360 && r.endMinutes >= 479)).toBe(true);
      // 08:00 adjacent start remains available
      const blocksEight = ranges.some(
        (r) => r.startMinutes <= 480 && r.endMinutes >= 480,
      );
      expect(blocksEight).toBe(false);
    });

    it("blocks ends that would span into another section", () => {
      const ranges = blockedRangesForSectionTimePick({
        field: "end",
        editingSortOrder: 1,
        sections: [
          { sortOrder: 0, startTime: "06:00", endTime: "08:00" },
          { sortOrder: 1, startTime: "05:00", endTime: "12:00" },
        ],
      });
      // start 05:00 with other [06:00,08:00) → ends after 06:00 overlap
      expect(ranges.some((r) => r.startMinutes <= 361 && r.endMinutes >= 361)).toBe(true);
    });
  });

  describe("suggestNextSectionTimes", () => {
    it("defaults to 10:00–12:00 when empty", () => {
      expect(suggestNextSectionTimes([])).toEqual({
        startTime: "10:00",
        endTime: "12:00",
      });
    });

    it("places the next slot after the last section", () => {
      expect(
        suggestNextSectionTimes([{ startTime: "06:00", endTime: "08:00" }]),
      ).toEqual({ startTime: "08:00", endTime: "10:00" });
    });
  });

  describe("validateActiveDaysSectionsNoOverlap", () => {
    it("returns null when each day is clean", () => {
      expect(
        validateActiveDaysSectionsNoOverlap(
          [
            row({ weekday: 1, startTime: "06:00", endTime: "08:00" }),
            row({
              weekday: 1,
              sortOrder: 1,
              startTime: "09:00",
              endTime: "12:00",
              label: "Second",
            }),
            row({ weekday: 2, startTime: "06:00", endTime: "08:00" }),
          ],
          [1, 2],
        ),
      ).toBeNull();
    });

    it("prefixes weekday when a day overlaps", () => {
      expect(
        validateActiveDaysSectionsNoOverlap(
          [
            row({ weekday: 1, startTime: "06:00", endTime: "08:00" }),
            row({
              weekday: 1,
              sortOrder: 1,
              startTime: "07:00",
              endTime: "09:00",
              label: "Clash",
            }),
          ],
          [1],
        ),
      ).toMatch(/^Mon:.*overlaps/);
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
