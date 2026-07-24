import { describe, expect, it } from "vitest";
import { formatPriceEn, parsePriceInput } from "./parseVenueTablePrice";

describe("parseVenueTablePrice", () => {
  it("rejects empty input as required", () => {
    expect(parsePriceInput("")).toEqual({ ok: false, value: null });
    expect(parsePriceInput("   ")).toEqual({ ok: false, value: null });
  });

  it("parses a valid number", () => {
    expect(parsePriceInput("250")).toEqual({ ok: true, value: 250 });
    expect(parsePriceInput("12.5")).toEqual({ ok: true, value: 12.5 });
  });

  it("strips comma thousands separators", () => {
    expect(parsePriceInput("1,250")).toEqual({ ok: true, value: 1250 });
  });

  it("rejects invalid or negative input", () => {
    expect(parsePriceInput("abc")).toEqual({ ok: false, value: null });
    expect(parsePriceInput("-1")).toEqual({ ok: false, value: null });
  });

  it("formatPriceEn formats amounts", () => {
    expect(formatPriceEn(250)).toMatch(/\$250/);
  });
});
