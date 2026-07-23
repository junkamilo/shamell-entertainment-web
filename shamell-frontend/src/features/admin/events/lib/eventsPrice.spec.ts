import { describe, expect, it } from "vitest";
import { formatPriceEn, formatPriceInput, parseOptionalPrice } from "./eventsPrice";

describe("eventsPrice", () => {
  describe("parseOptionalPrice", () => {
    it("returns undefined for empty create input", () => {
      expect(parseOptionalPrice("", "create")).toEqual({ ok: true, value: undefined });
      expect(parseOptionalPrice("   ", "create")).toEqual({ ok: true, value: undefined });
    });

    it("returns null for empty edit input", () => {
      expect(parseOptionalPrice("", "edit")).toEqual({ ok: true, value: null });
      expect(parseOptionalPrice("   ", "edit")).toEqual({ ok: true, value: null });
    });

    it("parses a valid number and accepts comma decimals", () => {
      expect(parseOptionalPrice("1500", "create")).toEqual({ ok: true, value: 1500 });
      expect(parseOptionalPrice("12,5", "edit")).toEqual({ ok: true, value: 12.5 });
    });

    it("rounds to two decimal places", () => {
      expect(parseOptionalPrice("1.239", "create")).toEqual({ ok: true, value: 1.24 });
    });

    it("rejects invalid or negative input", () => {
      expect(parseOptionalPrice("abc", "create")).toEqual({
        ok: false,
        message: "Invalid price.",
      });
      expect(parseOptionalPrice("-1", "edit")).toEqual({
        ok: false,
        message: "Invalid price.",
      });
    });

    it("rejects prices that are too high", () => {
      expect(parseOptionalPrice("100000000", "create")).toEqual({
        ok: false,
        message: "Price is too high.",
      });
    });
  });

  describe("formatPriceEn", () => {
    it("returns an em dash for nullish or NaN", () => {
      expect(formatPriceEn(null)).toBe("—");
      expect(formatPriceEn(undefined)).toBe("—");
      expect(formatPriceEn(Number.NaN)).toBe("—");
    });

    it("formats a numeric price with en-US grouping", () => {
      expect(formatPriceEn(2500)).toBe("2,500");
    });
  });

  describe("formatPriceInput", () => {
    it("stringifies the numeric value", () => {
      expect(formatPriceInput(2500)).toBe("2500");
      expect(formatPriceInput(12.5)).toBe("12.5");
    });
  });
});
