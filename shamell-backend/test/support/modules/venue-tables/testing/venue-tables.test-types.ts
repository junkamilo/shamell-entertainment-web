/** Narrow response shapes for venue-tables e2e / deep HTTP tests (no any). */

export type ErrorBody = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

export type VenueTableBody = {
  id: string;
  tableName: string;
  displayLabel: string;
  size: string;
  includedChairs: number;
  bundlePrice: number;
  visualCoordinates: { x: number; y: number } | null;
  isActive: boolean;
  sortOrder: number;
};

export type VenueTablesListBody = VenueTableBody[];

export type BulkCreateBody = {
  created: VenueTableBody[];
  count: number;
};

export type BulkPriceBody = {
  scope: string;
  size: string;
  updatedCount: number;
};

export type BulkDeleteBody = {
  scope: string;
  size: string | null;
  deletedCount: number;
};
