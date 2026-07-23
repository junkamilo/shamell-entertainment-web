import { describe, expect, it } from "vitest";
import {
  buildServiceUpsertFormData,
  normalizeItemsFromText,
  parsePriceInput,
} from "./servicesFormUtils";
import { FIXTURE_SERVICE_ID, FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";

describe("servicesFormUtils", () => {
  describe("normalizeItemsFromText", () => {
    it("splits lines, trims, and drops blanks", () => {
      expect(normalizeItemsFromText("  Dance set  \n\nSound check\n")).toEqual([
        "Dance set",
        "Sound check",
      ]);
    });
  });

  describe("parsePriceInput", () => {
    it("returns null value for empty input", () => {
      expect(parsePriceInput("")).toEqual({ ok: true, value: null });
      expect(parsePriceInput("   ")).toEqual({ ok: true, value: null });
    });

    it("parses a valid number", () => {
      expect(parsePriceInput("1500")).toEqual({ ok: true, value: 1500 });
      expect(parsePriceInput("12.5")).toEqual({ ok: true, value: 12.5 });
    });

    it("accepts comma as decimal separator", () => {
      expect(parsePriceInput("12,5")).toEqual({ ok: true, value: 12.5 });
    });

    it("rejects invalid or negative input", () => {
      expect(parsePriceInput("abc")).toEqual({ ok: false, value: null });
      expect(parsePriceInput("-1")).toEqual({ ok: false, value: null });
    });
  });

  describe("buildServiceUpsertFormData", () => {
    it("appends price when parsed value is present", () => {
      const form = buildServiceUpsertFormData({
        serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
        description: "Private show package with dancers and staging.",
        items: ["Dance set"],
        parsedPrice: { ok: true, value: 1500 },
        editingId: null,
        image: null,
      });

      expect(form.get("serviceTypeId")).toBe(FIXTURE_SERVICE_TYPE_ID);
      expect(form.get("description")).toBe("Private show package with dancers and staging.");
      expect(form.getAll("items")).toEqual(["Dance set"]);
      expect(form.get("price")).toBe("1500");
      expect(form.get("image")).toBeNull();
    });

    it("clears price with empty string when editing and value is null", () => {
      const form = buildServiceUpsertFormData({
        serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
        description: "Private show package with dancers and staging.",
        items: [],
        parsedPrice: { ok: true, value: null },
        editingId: FIXTURE_SERVICE_ID,
        image: null,
      });

      expect(form.get("price")).toBe("");
    });

    it("omits price when creating without a price", () => {
      const form = buildServiceUpsertFormData({
        serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
        description: "Private show package with dancers and staging.",
        items: [],
        parsedPrice: { ok: true, value: null },
        editingId: null,
        image: null,
      });

      expect(form.get("price")).toBeNull();
    });
  });
});
