import { describe, expect, it } from "vitest";
import { TYPE_PILL_STYLES } from "./eventsConstants";
import {
  displayEventHeading,
  eventTitleForTablePreview,
  firstLineOfEventDescription,
  formatShortDateUs,
  pillClassForTypeName,
  pillIndexForTypeName,
} from "./eventsDisplay";

describe("eventsDisplay", () => {
  describe("pillIndexForTypeName", () => {
    it("returns a number within TYPE_PILL_STYLES bounds", () => {
      const index = pillIndexForTypeName("Private weddings");
      expect(typeof index).toBe("number");
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(TYPE_PILL_STYLES.length);
    });
  });

  describe("pillClassForTypeName", () => {
    it("returns a class string from TYPE_PILL_STYLES", () => {
      const cls = pillClassForTypeName("Private weddings");
      expect(TYPE_PILL_STYLES).toContain(cls);
    });
  });

  describe("displayEventHeading", () => {
    it("returns No description for empty input", () => {
      expect(displayEventHeading("")).toEqual({ title: "No description", subtitle: "" });
      expect(displayEventHeading("   ")).toEqual({ title: "No description", subtitle: "" });
    });

    it("splits multi-line description into title and subtitle", () => {
      expect(displayEventHeading("Private wedding\nWith full staging")).toEqual({
        title: "Private wedding",
        subtitle: "With full staging",
      });
    });

    it("truncates long first lines with an ellipsis", () => {
      const long = "a".repeat(70);
      const result = displayEventHeading(long);
      expect(result.title.endsWith("…")).toBe(true);
      expect(result.title.length).toBeLessThanOrEqual(63);
    });
  });

  describe("firstLineOfEventDescription", () => {
    it("returns the trimmed first line", () => {
      expect(firstLineOfEventDescription("  Title\nBody  ")).toBe("Title");
      expect(firstLineOfEventDescription("")).toBe("");
    });
  });

  describe("eventTitleForTablePreview", () => {
    it("returns No description when blank", () => {
      expect(eventTitleForTablePreview("")).toBe("No description");
    });

    it("returns the first line when within max length", () => {
      expect(eventTitleForTablePreview("Short title")).toBe("Short title");
    });

    it("truncates with ellipsis when over maxLen", () => {
      expect(eventTitleForTablePreview("abcdefghijklmnopqrstuvwxyz0123456789", 10)).toBe(
        "abcdefghi…",
      );
    });
  });

  describe("formatShortDateUs", () => {
    it("returns an em dash for missing or invalid dates", () => {
      expect(formatShortDateUs(undefined)).toBe("—");
      expect(formatShortDateUs("not-a-date")).toBe("—");
    });

    it("formats a valid ISO date", () => {
      const iso = "2026-07-20T12:00:00.000Z";
      expect(formatShortDateUs(iso)).toBe(
        new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" }).replace(".", ""),
      );
    });
  });
});
