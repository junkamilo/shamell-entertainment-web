import { describe, expect, it } from "vitest";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import {
  buildStandaloneChairPriceMap,
  resolveStandaloneChairUnitPrice,
} from "./resolveStandaloneChairUnitPrice";

function standaloneChair(
  overrides: Partial<Extract<PlacedLayoutItem, { kind: "standalone_chair" }>> = {},
): PlacedLayoutItem {
  return {
    id: "chair-1",
    kind: "standalone_chair",
    venueStandaloneChairId: "sc-1",
    x: 0,
    y: 0,
    rotation: 0,
    ...overrides,
  };
}

describe("resolveStandaloneChairUnitPrice", () => {
  it("returns null for non-chair items", () => {
    const table: PlacedLayoutItem = {
      id: "t-1",
      kind: "catalog_table",
      venueTableConfigId: "tc-1",
      tableName: "Large 1",
      size: "LARGE",
      includedChairs: 8,
      x: 0,
      y: 0,
      rotation: 0,
    };
    expect(resolveStandaloneChairUnitPrice(table, new Map(), 35)).toBeNull();
  });

  it("prefers item unitPrice when set", () => {
    const price = resolveStandaloneChairUnitPrice(
      standaloneChair({ unitPrice: 42 }),
      new Map(),
      35,
    );
    expect(price).toBe(42);
  });

  it("falls back to catalog map then global fallback", () => {
    const map = new Map([["sc-1", 30]]);
    expect(resolveStandaloneChairUnitPrice(standaloneChair(), map, 35)).toBe(30);
    expect(
      resolveStandaloneChairUnitPrice(
        standaloneChair({ venueStandaloneChairId: "missing" }),
        map,
        35,
      ),
    ).toBe(35);
  });

  it("returns null when no valid price is available", () => {
    expect(
      resolveStandaloneChairUnitPrice(
        standaloneChair({ venueStandaloneChairId: "missing" }),
        new Map(),
        0,
      ),
    ).toBeNull();
  });
});

describe("buildStandaloneChairPriceMap", () => {
  it("builds a map from chair catalog rows", () => {
    const map = buildStandaloneChairPriceMap([
      { id: "sc-1", unitPrice: 35 },
      { id: "sc-2", unitPrice: 40 },
    ]);
    expect(map.get("sc-1")).toBe(35);
    expect(map.get("sc-2")).toBe(40);
  });

  it("returns empty map for undefined input", () => {
    expect(buildStandaloneChairPriceMap(undefined).size).toBe(0);
  });
});
