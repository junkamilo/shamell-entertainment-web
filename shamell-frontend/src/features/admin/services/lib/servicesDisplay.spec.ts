import { describe, expect, it } from "vitest";
import { TYPE_PILL_STYLES } from "./servicesConstants";
import {
  displayServiceHeading,
  formatPriceEn,
  pillClassForTypeName,
  serviceDeleteConfirmName,
} from "./servicesDisplay";

describe("servicesDisplay", () => {
  describe("displayServiceHeading", () => {
    it("returns No description for empty input", () => {
      expect(displayServiceHeading("")).toEqual({
        title: "No description",
        subtitle: "",
      });
      expect(displayServiceHeading("   ")).toEqual({
        title: "No description",
        subtitle: "",
      });
    });

    it("splits multi-line description into title and subtitle", () => {
      expect(displayServiceHeading("Private show\nWith dancers and staging")).toEqual({
        title: "Private show",
        subtitle: "With dancers and staging",
      });
    });
  });

  describe("serviceDeleteConfirmName", () => {
    it("uses the first line as the confirm name", () => {
      expect(serviceDeleteConfirmName("Private show package.\nMore details.")).toBe(
        "Private show package.",
      );
    });

    it("uses the empty-heading label when description is blank", () => {
      expect(serviceDeleteConfirmName("")).toBe("No description");
    });
  });

  describe("formatPriceEn", () => {
    it("returns an em dash for nullish or NaN", () => {
      expect(formatPriceEn(null)).toBe("—");
      expect(formatPriceEn(undefined)).toBe("—");
      expect(formatPriceEn(Number.NaN)).toBe("—");
    });

    it("formats a numeric price with en-US grouping", () => {
      expect(formatPriceEn(1500)).toBe("1,500");
    });
  });

  describe("pillClassForTypeName", () => {
    it("returns a class string from TYPE_PILL_STYLES", () => {
      const cls = pillClassForTypeName("Performance");
      expect(TYPE_PILL_STYLES).toContain(cls);
    });
  });
});
