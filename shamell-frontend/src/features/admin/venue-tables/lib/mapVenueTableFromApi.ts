import type { TableSize, VenueTableConfig } from "../types/venueTables.types";

export function mapVenueTableFromApi(data: unknown): VenueTableConfig | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.tableName !== "string") return null;

  let visualCoordinates: VenueTableConfig["visualCoordinates"] = null;
  const vc = o.visualCoordinates;
  if (
    vc &&
    typeof vc === "object" &&
    typeof (vc as { x?: unknown }).x === "number" &&
    typeof (vc as { y?: unknown }).y === "number"
  ) {
    visualCoordinates = { x: (vc as { x: number }).x, y: (vc as { y: number }).y };
  }

  const displayLabel =
    typeof o.displayLabel === "string" ? o.displayLabel : undefined;

  return {
    id: o.id,
    tableName: o.tableName,
    displayLabel,
    size: o.size as TableSize,
    includedChairs: Number(o.includedChairs ?? 0),
    bundlePrice: Number(o.bundlePrice ?? 0),
    visualCoordinates,
    isActive: Boolean(o.isActive ?? true),
    sortOrder: Number(o.sortOrder ?? 0),
    createdAt: String(o.createdAt ?? ""),
    updatedAt: String(o.updatedAt ?? ""),
  };
}

export function mapVenueTablesListFromApi(data: unknown): VenueTableConfig[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => mapVenueTableFromApi(row))
    .filter((row): row is VenueTableConfig => row !== null);
}
