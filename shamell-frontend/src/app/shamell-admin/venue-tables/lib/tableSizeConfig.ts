import type { TableSize } from "../types/venueTables.types";

export type TableSizeMeta = {
  label: string;
  shortLabel: string;
  tableRadius: number;
  chairRadius: number;
  chairOrbit: number;
  minChairs: number;
  maxChairs: number;
  defaultChairs: number;
};

export const TABLE_SIZE_CONFIG: Record<TableSize, TableSizeMeta> = {
  SMALL: {
    label: "Small",
    shortLabel: "S",
    tableRadius: 17,
    chairRadius: 6,
    chairOrbit: 38,
    minChairs: 2,
    maxChairs: 4,
    defaultChairs: 3,
  },
  MEDIUM: {
    label: "Medium",
    shortLabel: "M",
    tableRadius: 22,
    chairRadius: 6,
    chairOrbit: 46,
    minChairs: 3,
    maxChairs: 6,
    defaultChairs: 4,
  },
  LARGE: {
    label: "Large",
    shortLabel: "L",
    tableRadius: 28,
    chairRadius: 7,
    chairOrbit: 54,
    minChairs: 4,
    maxChairs: 8,
    defaultChairs: 6,
  },
};

export const TABLE_SIZE_ORDER: TableSize[] = ["LARGE", "MEDIUM", "SMALL"];

export function clampChairsForSize(size: TableSize, chairs: number): number {
  const { minChairs, maxChairs, defaultChairs } = TABLE_SIZE_CONFIG[size];
  if (!Number.isFinite(chairs)) return defaultChairs;
  return Math.min(maxChairs, Math.max(minChairs, Math.round(chairs)));
}

export function formatVenueTableDisplayLabel(table: {
  size: TableSize;
  displayLabel?: string;
}): string {
  if (table.displayLabel?.trim()) return table.displayLabel.trim();
  return TABLE_SIZE_CONFIG[table.size].label;
}

export function formatVenueTableAdminSubtitle(table: {
  id: string;
  includedChairs: number;
  bundlePrice: number;
}): string {
  const shortId = table.id.replace(/-/g, "").slice(0, 6);
  return `${table.includedChairs} chairs · $${table.bundlePrice} · #${shortId}`;
}
