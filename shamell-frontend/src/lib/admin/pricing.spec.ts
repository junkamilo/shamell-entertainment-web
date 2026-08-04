import { describe, it, expect } from "vitest";
import { makePriceCases } from "./test/fixtures/adminLib.fixture";
import { formatPriceEn, parsePriceInput } from "./pricing";

describe("parsePriceInput", () => {
  const cases = makePriceCases();

  it("parses comma-formatted amounts and rounds to cents", () => {
    expect(parsePriceInput(cases.valid)).toEqual({
      ok: true,
      value: cases.validRounded,
    });
    expect(parsePriceInput("10.999")).toEqual({ ok: true, value: 11 });
  });

  it("rejects empty, negative, and non-numeric input", () => {
    expect(parsePriceInput(cases.empty)).toEqual({ ok: false, value: null });
    expect(parsePriceInput(cases.negative)).toEqual({ ok: false, value: null });
    expect(parsePriceInput(cases.invalid)).toEqual({ ok: false, value: null });
  });
});

describe("formatPriceEn", () => {
  it("formats USD amounts in en-US", () => {
    expect(formatPriceEn(1250.5)).toBe("$1,250.5");
    expect(formatPriceEn(0)).toBe("$0");
  });

  it("returns an em dash for nullish or NaN values", () => {
    expect(formatPriceEn(null)).toBe("—");
    expect(formatPriceEn(undefined)).toBe("—");
    expect(formatPriceEn(Number.NaN)).toBe("—");
  });
});
