export type LayoutShapeKind = 'catalog_table' | 'standalone_chair';
export type VenueTableSizeLabel = 'LARGE' | 'MEDIUM' | 'SMALL';

export type PlacedLayoutItem =
  | {
      id: string;
      kind: 'catalog_table';
      venueTableConfigId: string;
      tableName: string;
      size: VenueTableSizeLabel;
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

export type FloorSceneZoneTransform = {
  x: number;
  z: number;
  rotationY: number;
};

export type FloorSceneZones = {
  stage: FloorSceneZoneTransform;
  carpet: FloorSceneZoneTransform;
};

/** Prisma-shaped venue_floor_layouts row used by mappers/repository. */
export type FloorLayoutRow = {
  id: string;
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: unknown;
  sceneZones: unknown;
  isActive: boolean;
  updatedAt: Date;
  createdAt?: Date;
};

export type FloorLayoutMapped = {
  id: string | null;
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: PlacedLayoutItem[];
  sceneZones: FloorSceneZones;
  totalChairs: number;
  updatedAt: Date | null;
  isDefault: boolean;
  hasLegacyItems: boolean;
};

export type FloorLayoutPaletteTable = {
  id: string;
  tableName: string;
  displayLabel: string;
  size: VenueTableSizeLabel;
  includedChairs: number;
  sortOrder: number;
};

export type FloorLayoutPaletteChair = {
  id: string;
  chairName: string;
  displayLabel: string;
  unitPrice: number;
  sortOrder: number;
};

export type FloorLayoutPalette = {
  tablesBySize: Record<VenueTableSizeLabel, number>;
  standaloneChairsAvailable: number;
  unplacedTables: FloorLayoutPaletteTable[];
  unplacedChairs: FloorLayoutPaletteChair[];
  placedTableIds: string[];
  placedChairIds: string[];
  placedChairCount: number;
};

export type NormalizeCatalogTable = {
  id: string;
  size: VenueTableSizeLabel;
  includedChairs: number;
};

export type NormalizeCatalogChair = {
  id: string;
};

export type NormalizeLayoutItemInput = {
  id: string;
  kind: string;
  venueTableConfigId?: string;
  venueStandaloneChairId?: string;
  x: number;
  y: number;
  rotation: number;
};
