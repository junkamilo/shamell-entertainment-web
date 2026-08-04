import { describe, expect, it } from "vitest";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { placedSummaryFromItems } from "./placedSummaryFromItems";

describe("placedSummaryFromItems", () => {
  it("counts tables by size and standalone chairs", () => {
    const items: PlacedLayoutItem[] = [
      {
        id: "t-large",
        kind: "catalog_table",
        venueTableConfigId: "tc-1",
        tableName: "Large 1",
        size: "LARGE",
        includedChairs: 8,
        x: 0,
        y: 0,
        rotation: 0,
      },
      {
        id: "t-medium",
        kind: "catalog_table",
        venueTableConfigId: "tc-2",
        tableName: "Medium 1",
        size: "MEDIUM",
        includedChairs: 6,
        x: 0,
        y: 0,
        rotation: 0,
      },
      {
        id: "t-small",
        kind: "catalog_table",
        venueTableConfigId: "tc-3",
        tableName: "Small 1",
        size: "SMALL",
        includedChairs: 4,
        x: 0,
        y: 0,
        rotation: 0,
      },
      {
        id: "c-1",
        kind: "standalone_chair",
        venueStandaloneChairId: "sc-1",
        x: 0,
        y: 0,
        rotation: 0,
      },
    ];

    expect(placedSummaryFromItems(items)).toEqual({
      large: 1,
      medium: 1,
      small: 1,
      chairs: 1,
    });
  });

  it("returns zeros for empty layout", () => {
    expect(placedSummaryFromItems([])).toEqual({
      large: 0,
      medium: 0,
      small: 0,
      chairs: 0,
    });
  });
});
