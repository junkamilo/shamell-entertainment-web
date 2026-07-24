import { describe, expect, it } from "vitest";
import {
  canBulkEditTablePrices,
  getBulkEditTablePricesBlockedDescription,
  suggestBulkBundlePrice,
} from "./venueTablesUsage";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";

describe("venueTablesUsage", () => {
  it("allows bulk edit only for a size tab with tables", () => {
    expect(canBulkEditTablePrices("ALL", 5)).toBe(false);
    expect(canBulkEditTablePrices("LARGE", 0)).toBe(false);
    expect(canBulkEditTablePrices("LARGE", 3)).toBe(true);
  });

  it("returns blocked description for ALL filter", () => {
    expect(getBulkEditTablePricesBlockedDescription()).toMatch(/Select a size tab/);
  });

  it("suggestBulkBundlePrice returns empty for no items", () => {
    expect(suggestBulkBundlePrice([])).toBe("");
  });

  it("suggestBulkBundlePrice returns shared price when all match", () => {
    const items = [
      makeVenueTable({ bundlePrice: 200 }),
      makeVenueTable({ bundlePrice: 200 }),
    ];
    expect(suggestBulkBundlePrice(items)).toBe("200");
  });

  it("suggestBulkBundlePrice returns rounded average when prices differ", () => {
    const items = [
      makeVenueTable({ bundlePrice: 100 }),
      makeVenueTable({ bundlePrice: 200 }),
    ];
    expect(suggestBulkBundlePrice(items)).toBe("150");
  });
});
