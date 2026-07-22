export type TableSize = "LARGE" | "MEDIUM" | "SMALL";

export type VisualCoordinates = {
  x: number;
  y: number;
};

export type VenueTableConfig = {
  id: string;
  tableName: string;
  displayLabel?: string;
  size: TableSize;
  includedChairs: number;
  bundlePrice: number;
  visualCoordinates: VisualCoordinates | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type VenueTableConfigPayload = {
  size: TableSize;
  includedChairs: number;
  bundlePrice: number;
  visualX?: number;
  visualY?: number;
  isActive?: boolean;
  sortOrder?: number;
};

export type BulkVenueTablePayload = {
  quantity: number;
  size: TableSize;
  includedChairs: number;
  bundlePrice: number;
};

export type BulkCreateVenueTablesResult = {
  created: VenueTableConfig[];
  count: number;
};

export const BULK_TABLE_MAX_QUANTITY = 50;
