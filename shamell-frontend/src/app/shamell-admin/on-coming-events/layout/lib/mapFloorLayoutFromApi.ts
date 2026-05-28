import { mergeFloorSceneZones } from "@/components/venue-3d/floorSceneZonesDefaults";
import type { PlacedLayoutItem, VenueFloorLayout, VenueTableSize } from "../types/floorLayout.types";
import {
  DEFAULT_VIEW_BOX_HEIGHT,
  DEFAULT_VIEW_BOX_WIDTH,
} from "../types/floorLayout.types";
import { chairCountForItem } from "./floorLayoutStats";

const LEGACY_KINDS = [
  "big_table",
  "small_table",
  "bench",
  "chair",
  "rectangle",
  "square",
  "stage",
  "bar",
];

function isLegacyKind(kind: string): boolean {
  return LEGACY_KINDS.includes(kind);
}

function mapPlacedItem(raw: unknown): PlacedLayoutItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.kind !== "string") return null;
  if (isLegacyKind(o.kind)) return null;

  const x = Number(o.x);
  const y = Number(o.y);
  const rotation = Number(o.rotation);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(rotation)) {
    return null;
  }

  if (
    o.kind === "standalone_chair" &&
    typeof o.venueStandaloneChairId === "string"
  ) {
    return {
      id: o.id,
      kind: "standalone_chair",
      venueStandaloneChairId: o.venueStandaloneChairId,
      chairName: typeof o.chairName === "string" ? o.chairName : "Chair",
      x,
      y,
      rotation,
    };
  }

  if (
    o.kind === "catalog_table" &&
    typeof o.venueTableConfigId === "string" &&
    typeof o.tableName === "string"
  ) {
    const size = o.size as VenueTableSize;
    if (!["LARGE", "MEDIUM", "SMALL"].includes(size)) return null;
    return {
      id: o.id,
      kind: "catalog_table",
      venueTableConfigId: o.venueTableConfigId,
      tableName: o.tableName,
      size,
      includedChairs: Number(o.includedChairs ?? 0),
      x,
      y,
      rotation,
    };
  }

  return null;
}

export function mapFloorLayoutFromApi(data: unknown): VenueFloorLayout | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (!Array.isArray(o.items)) return null;

  const rawItems = o.items as unknown[];
  const hasLegacyItems = rawItems.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const kind = (entry as Record<string, unknown>).kind;
    return typeof kind === "string" && isLegacyKind(kind);
  });

  const items = rawItems
    .map(mapPlacedItem)
    .filter((item): item is PlacedLayoutItem => item !== null);

  const totalChairs =
    typeof o.totalChairs === "number"
      ? o.totalChairs
      : items.reduce((sum, item) => sum + chairCountForItem(item), 0);

  return {
    id: typeof o.id === "string" ? o.id : null,
    viewBoxWidth:
      typeof o.viewBoxWidth === "number" ? o.viewBoxWidth : DEFAULT_VIEW_BOX_WIDTH,
    viewBoxHeight:
      typeof o.viewBoxHeight === "number" ? o.viewBoxHeight : DEFAULT_VIEW_BOX_HEIGHT,
    backgroundVersion:
      typeof o.backgroundVersion === "string" ? o.backgroundVersion : "v1",
    items,
    sceneZones: mergeFloorSceneZones(o.sceneZones),
    totalChairs,
    updatedAt:
      o.updatedAt instanceof Date
        ? o.updatedAt.toISOString()
        : typeof o.updatedAt === "string"
          ? o.updatedAt
          : null,
    isDefault: o.isDefault === true,
    hasLegacyItems: o.hasLegacyItems === true || hasLegacyItems,
  };
}

export function mapFloorLayoutPaletteFromApi(data: unknown) {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const tbs = o.tablesBySize as Record<string, unknown> | undefined;
  const unplaced = Array.isArray(o.unplacedTables) ? o.unplacedTables : [];
  return {
    tablesBySize: {
      LARGE: Number(tbs?.LARGE ?? 0),
      MEDIUM: Number(tbs?.MEDIUM ?? 0),
      SMALL: Number(tbs?.SMALL ?? 0),
    },
    standaloneChairsAvailable: Number(o.standaloneChairsAvailable ?? 0),
    unplacedChairs: Array.isArray(o.unplacedChairs)
      ? o.unplacedChairs
          .map((c) => {
            if (!c || typeof c !== "object") return null;
            const row = c as Record<string, unknown>;
            if (typeof row.id !== "string" || typeof row.chairName !== "string") {
              return null;
            }
            return {
              id: row.id,
              chairName: row.chairName,
              displayLabel:
                typeof row.displayLabel === "string" ? row.displayLabel : "Chair",
              unitPrice: Number(row.unitPrice ?? 0),
              sortOrder: Number(row.sortOrder ?? 0),
            };
          })
          .filter((c): c is NonNullable<typeof c> => c !== null)
      : [],
    unplacedTables: unplaced
      .map((t) => {
        if (!t || typeof t !== "object") return null;
        const row = t as Record<string, unknown>;
        if (typeof row.id !== "string" || typeof row.tableName !== "string") return null;
        const size = row.size as VenueTableSize;
        if (!["LARGE", "MEDIUM", "SMALL"].includes(size)) return null;
        return {
          id: row.id,
          tableName: row.tableName,
          size,
          includedChairs: Number(row.includedChairs ?? 0),
          sortOrder: Number(row.sortOrder ?? 0),
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null),
    placedTableIds: Array.isArray(o.placedTableIds)
      ? o.placedTableIds.filter((id): id is string => typeof id === "string")
      : [],
    placedChairIds: Array.isArray(o.placedChairIds)
      ? o.placedChairIds.filter((id): id is string => typeof id === "string")
      : [],
    placedChairCount: Number(o.placedChairCount ?? 0),
  };
}
