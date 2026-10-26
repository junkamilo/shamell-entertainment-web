/** Narrow response shapes for floor-layout e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type FloorLayoutItemBody =
  | {
      id: string;
      kind: 'catalog_table';
      venueTableConfigId: string;
      tableName: string;
      size: string;
      includedChairs: number;
      x: number;
      y: number;
      rotation: number;
    }
  | {
      id: string;
      kind: 'standalone_chair';
      venueStandaloneChairId: string;
      chairName: string;
      unitPrice?: number;
      x: number;
      y: number;
      rotation: number;
    };

export type FloorLayoutBody = {
  id: string | null;
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: FloorLayoutItemBody[];
  sceneZones: {
    stage: { x: number; z: number; rotationY: number };
    carpet: { x: number; z: number; rotationY: number };
  };
  totalChairs: number;
  updatedAt: string | Date | null;
  isDefault: boolean;
  hasLegacyItems: boolean;
};

export type PaletteBody = {
  tablesBySize: {
    LARGE: number;
    MEDIUM: number;
    SMALL: number;
  };
  standaloneChairsAvailable: number;
  unplacedTables: Array<{
    id: string;
    tableName: string;
    displayLabel: string;
    size: string;
    includedChairs: number;
    sortOrder: number;
  }>;
  unplacedChairs: Array<{
    id: string;
    chairName: string;
    displayLabel: string;
    unitPrice: number;
    sortOrder: number;
  }>;
  placedTableIds: string[];
  placedChairIds: string[];
  placedChairCount: number;
};
