import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEW_BOX_HEIGHT,
  DEFAULT_VIEW_BOX_WIDTH,
  isCatalogTableItem,
  isStandaloneChairItem,
  LAYOUT_SHAPE_KINDS,
  TABLE_SIZE_LABELS,
  type PlacedLayoutItem,
} from "./layoutTypes";

const tableItem: PlacedLayoutItem = {
  id: "t1",
  kind: "catalog_table",
  venueTableConfigId: "cfg-1",
  tableName: "Table 1",
  size: "LARGE",
  includedChairs: 8,
  x: 0,
  y: 0,
  rotation: 0,
};

const chairItem: PlacedLayoutItem = {
  id: "c1",
  kind: "standalone_chair",
  venueStandaloneChairId: "chair-1",
  chairName: "Chair 1",
  x: 1,
  y: 1,
  rotation: 0,
};

describe("layoutTypes", () => {
  it("exposes stable shape kinds", () => {
    expect(LAYOUT_SHAPE_KINDS).toEqual(["catalog_table", "standalone_chair"]);
  });

  it("exposes table size labels for LARGE MEDIUM SMALL", () => {
    expect(Object.keys(TABLE_SIZE_LABELS).sort()).toEqual(["LARGE", "MEDIUM", "SMALL"]);
    expect(TABLE_SIZE_LABELS.LARGE).toBe("Large");
    expect(TABLE_SIZE_LABELS.MEDIUM).toBe("Medium");
    expect(TABLE_SIZE_LABELS.SMALL).toBe("Small");
  });

  it("exposes stable default view box dimensions", () => {
    expect(DEFAULT_VIEW_BOX_WIDTH).toBe(614);
    expect(DEFAULT_VIEW_BOX_HEIGHT).toBe(944);
  });

  it("narrows placed items with type guards", () => {
    expect(isCatalogTableItem(tableItem)).toBe(true);
    expect(isStandaloneChairItem(tableItem)).toBe(false);
    expect(isStandaloneChairItem(chairItem)).toBe(true);
    expect(isCatalogTableItem(chairItem)).toBe(false);

    if (isCatalogTableItem(tableItem)) {
      expect(tableItem.tableName).toBe("Table 1");
    }
    if (isStandaloneChairItem(chairItem)) {
      expect(chairItem.chairName).toBe("Chair 1");
    }
  });
});
