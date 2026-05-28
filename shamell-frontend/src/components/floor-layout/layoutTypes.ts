export const LAYOUT_SHAPE_KINDS = ["catalog_table", "standalone_chair"] as const;

export type LayoutShapeKind = (typeof LAYOUT_SHAPE_KINDS)[number];

export type VenueTableSize = "LARGE" | "MEDIUM" | "SMALL";

export type PlacedLayoutItem =
  | {
      id: string;
      kind: "catalog_table";
      venueTableConfigId: string;
      tableName: string;
      size: VenueTableSize;
      includedChairs: number;
      x: number;
      y: number;
      rotation: number;
    }
  | {
      id: string;
      kind: "standalone_chair";
      venueStandaloneChairId: string;
      chairName: string;
      x: number;
      y: number;
      rotation: number;
    };

export type VenueFloorLayout = {
  id: string | null;
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: PlacedLayoutItem[];
  totalChairs: number;
  updatedAt: string | null;
  isDefault?: boolean;
  hasLegacyItems?: boolean;
};

export type FloorLayoutPalette = {
  tablesBySize: Record<VenueTableSize, number>;
  standaloneChairsAvailable: number;
  unplacedTables: {
    id: string;
    tableName: string;
    size: VenueTableSize;
    includedChairs: number;
    sortOrder: number;
  }[];
  unplacedChairs: {
    id: string;
    chairName: string;
    displayLabel: string;
    unitPrice: number;
    sortOrder: number;
  }[];
  placedTableIds: string[];
  placedChairIds: string[];
  placedChairCount: number;
};

export const DEFAULT_VIEW_BOX_WIDTH = 1024;
export const DEFAULT_VIEW_BOX_HEIGHT = 944;

export const TABLE_SIZE_LABELS: Record<VenueTableSize, string> = {
  LARGE: "Large",
  MEDIUM: "Medium",
  SMALL: "Small",
};
