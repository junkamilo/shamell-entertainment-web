import { describe, expect, it } from "vitest";
import { FIXTURE_CATALOG_PRICE } from "./test/fixtures/uuids.fixture";
import {
  formatCatalogPriceAmount,
  formatCatalogPriceWithSuffix,
} from "./formatCatalogPrice";

describe("formatCatalogPriceAmount", () => {
  it("formats whole dollars without fraction digits", () => {
    expect(formatCatalogPriceAmount(FIXTURE_CATALOG_PRICE)).toBe("1,250");
    expect(formatCatalogPriceAmount(0)).toBe("0");
  });

  it("keeps up to two fraction digits", () => {
    expect(formatCatalogPriceAmount(19.5)).toBe("19.5");
    expect(formatCatalogPriceAmount(19.99)).toBe("19.99");
  });
});

describe("formatCatalogPriceWithSuffix", () => {
  it("returns null for nullish or NaN prices", () => {
    expect(formatCatalogPriceWithSuffix(null)).toBeNull();
    expect(formatCatalogPriceWithSuffix(undefined)).toBeNull();
    expect(formatCatalogPriceWithSuffix(Number.NaN)).toBeNull();
  });

  it("appends the default USD suffix", () => {
    expect(formatCatalogPriceWithSuffix(FIXTURE_CATALOG_PRICE)).toBe(
      "1,250 USD",
    );
  });

  it("allows a custom currency suffix", () => {
    expect(formatCatalogPriceWithSuffix(99, "EUR")).toBe("99 EUR");
  });
});
