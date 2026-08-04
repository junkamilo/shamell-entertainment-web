import { describe, expect, it } from "vitest";
import {
  formatPriceEn as formatLibPriceEn,
  parsePriceInput as parseLibPriceInput,
} from "@/lib/admin/pricing";
import {
  FIXTURE_PRICE_INPUT,
  FIXTURE_PRICE_VALUE,
} from "./test/fixtures/uuids.fixture";
import { formatPriceEn, parsePriceInput } from "./pricing";

describe("pricing (app shared re-export)", () => {
  it("re-exports the same helpers as @/lib/admin/pricing", () => {
    expect(parsePriceInput).toBe(parseLibPriceInput);
    expect(formatPriceEn).toBe(formatLibPriceEn);
  });

  it("parses comma-formatted price input", () => {
    expect(parsePriceInput(FIXTURE_PRICE_INPUT)).toEqual({
      ok: true,
      value: FIXTURE_PRICE_VALUE,
    });
  });

  it("rejects empty or invalid price input", () => {
    expect(parsePriceInput("")).toEqual({ ok: false, value: null });
    expect(parsePriceInput("abc")).toEqual({ ok: false, value: null });
    expect(parsePriceInput("-1")).toEqual({ ok: false, value: null });
  });

  it("formats USD amounts and falls back for nullish/NaN", () => {
    expect(formatPriceEn(FIXTURE_PRICE_VALUE)).toBe("$1,250.5");
    expect(formatPriceEn(null)).toBe("—");
    expect(formatPriceEn(undefined)).toBe("—");
    expect(formatPriceEn(Number.NaN)).toBe("—");
  });
});
