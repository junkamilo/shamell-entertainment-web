import { BadRequestException } from '@nestjs/common';
import { STANDALONE_CHAIR_DISPLAY_LABEL } from '../../standalone-chairs/utils/standalone-chair-names.util';
import {
  LEGACY_LAYOUT_KINDS,
  LAYOUT_SHAPE_KINDS,
  DEFAULT_BACKGROUND_VERSION,
  DEFAULT_VIEW_BOX_HEIGHT,
  DEFAULT_VIEW_BOX_WIDTH,
  VENUE_TABLE_SIZES,
} from '../constants/floor-layout.constants';
import type {
  FloorLayoutMapped,
  FloorLayoutRow,
  NormalizeCatalogChair,
  NormalizeCatalogTable,
  NormalizeLayoutItemInput,
  PlacedLayoutItem,
  VenueTableSizeLabel,
} from '../types/floor-layout.types';
import { getDefaultLayoutItems } from './floor-layout-defaults.util';
import {
  DEFAULT_FLOOR_SCENE_ZONES,
  mergeFloorSceneZones,
} from './floor-scene-zones.util';

export function isLegacyLayoutKind(kind: string): boolean {
  return (LEGACY_LAYOUT_KINDS as readonly string[]).includes(kind);
}

export function chairCountForItem(item: PlacedLayoutItem): number {
  if (item.kind === 'catalog_table') return item.includedChairs;
  return 1;
}

export function sumChairs(items: PlacedLayoutItem[]): number {
  return items.reduce((sum, item) => sum + chairCountForItem(item), 0);
}

export function hasLegacyItemsRaw(raw: unknown): boolean {
  if (!Array.isArray(raw)) return false;
  return raw.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    const kind = (entry as Record<string, unknown>).kind;
    return typeof kind === 'string' && isLegacyLayoutKind(kind);
  });
}

export function parseItemsLenient(raw: unknown): PlacedLayoutItem[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const result: PlacedLayoutItem[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    if (typeof o.id !== 'string' || typeof o.kind !== 'string') continue;
    if (isLegacyLayoutKind(o.kind)) continue;

    const x = Number(o.x);
    const y = Number(o.y);
    const rotation = Number(o.rotation);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(rotation)
    ) {
      continue;
    }

    if (
      o.kind === 'standalone_chair' &&
      typeof o.venueStandaloneChairId === 'string'
    ) {
      result.push({
        id: o.id,
        kind: 'standalone_chair',
        venueStandaloneChairId: o.venueStandaloneChairId,
        chairName: STANDALONE_CHAIR_DISPLAY_LABEL,
        x,
        y,
        rotation,
      });
      continue;
    }

    if (
      o.kind === 'catalog_table' &&
      typeof o.venueTableConfigId === 'string'
    ) {
      const size = o.size as VenueTableSizeLabel;
      if (!(VENUE_TABLE_SIZES as readonly string[]).includes(size)) continue;
      result.push({
        id: o.id,
        kind: 'catalog_table',
        venueTableConfigId: o.venueTableConfigId,
        tableName: typeof o.tableName === 'string' ? o.tableName : '',
        size,
        includedChairs: Number(o.includedChairs ?? 0),
        x,
        y,
        rotation,
      });
    }
  }

  return result;
}

export function parseItems(raw: unknown): PlacedLayoutItem[] {
  const lenient = parseItemsLenient(raw);
  return lenient.filter(
    (item): item is PlacedLayoutItem =>
      !isLegacyLayoutKind((item as { kind: string }).kind),
  );
}

export type NormalizeItemsCatalog = {
  tables: NormalizeCatalogTable[];
  chairs: NormalizeCatalogChair[];
  tableDisplayLabel: (size: VenueTableSizeLabel) => string;
  chairDisplayLabel: string;
};

/**
 * Pure normalize for upsert: clamps coords, validates catalog refs, rejects legacy.
 * Throws BadRequestException on invalid input (same semantics as legacy service).
 */
export function normalizeItems(
  raw: NormalizeLayoutItemInput[],
  viewBoxWidth: number,
  viewBoxHeight: number,
  catalog: NormalizeItemsCatalog,
): PlacedLayoutItem[] {
  const margin = 8;
  const seenIds = new Set<string>();
  const seenTableIds = new Set<string>();

  for (const item of raw) {
    if (isLegacyLayoutKind(item.kind)) {
      throw new BadRequestException(
        'Legacy layout items are no longer supported. Clear placed items and save again.',
      );
    }
  }

  const tableById = new Map(catalog.tables.map((t) => [t.id, t]));
  const chairById = new Map(catalog.chairs.map((c) => [c.id, c]));
  const maxStandaloneChairs = catalog.chairs.length;
  const seenChairIds = new Set<string>();
  let standaloneChairCount = 0;

  const normalized: PlacedLayoutItem[] = [];

  for (const item of raw) {
    if (seenIds.has(item.id)) {
      throw new BadRequestException('Duplicate layout item id.');
    }
    seenIds.add(item.id);

    if (!(LAYOUT_SHAPE_KINDS as readonly string[]).includes(item.kind)) {
      throw new BadRequestException(`Invalid shape kind: ${item.kind}`);
    }

    const x = Math.min(Math.max(item.x, margin), viewBoxWidth - margin);
    const y = Math.min(Math.max(item.y, margin), viewBoxHeight - margin);
    const rotation = Math.min(180, Math.max(-180, item.rotation));

    if (item.kind === 'standalone_chair') {
      if (!item.venueStandaloneChairId) {
        throw new BadRequestException(
          'standalone_chair items require venueStandaloneChairId.',
        );
      }
      if (seenChairIds.has(item.venueStandaloneChairId)) {
        throw new BadRequestException(
          `Chair "${item.venueStandaloneChairId}" is placed more than once on the layout.`,
        );
      }
      seenChairIds.add(item.venueStandaloneChairId);

      const chair = chairById.get(item.venueStandaloneChairId);
      if (!chair) {
        throw new BadRequestException(
          `Standalone chair "${item.venueStandaloneChairId}" not found or inactive.`,
        );
      }

      standaloneChairCount += 1;
      if (standaloneChairCount > maxStandaloneChairs) {
        throw new BadRequestException(
          `Cannot place more than ${maxStandaloneChairs} standalone chairs.`,
        );
      }
      normalized.push({
        id: item.id,
        kind: 'standalone_chair',
        venueStandaloneChairId: chair.id,
        chairName: catalog.chairDisplayLabel,
        x,
        y,
        rotation,
      });
      continue;
    }

    if (!item.venueTableConfigId) {
      throw new BadRequestException(
        'catalog_table items require venueTableConfigId.',
      );
    }
    if (seenTableIds.has(item.venueTableConfigId)) {
      throw new BadRequestException(
        `Table "${item.venueTableConfigId}" is placed more than once on the layout.`,
      );
    }
    seenTableIds.add(item.venueTableConfigId);

    const table = tableById.get(item.venueTableConfigId);
    if (!table) {
      throw new BadRequestException(
        `Venue table "${item.venueTableConfigId}" not found or inactive.`,
      );
    }

    normalized.push({
      id: item.id,
      kind: 'catalog_table',
      venueTableConfigId: table.id,
      tableName: catalog.tableDisplayLabel(table.size),
      size: table.size,
      includedChairs: table.includedChairs,
      x,
      y,
      rotation,
    });
  }

  return normalized;
}

export function mapVirtualLayout(id: string | null): FloorLayoutMapped {
  const items = getDefaultLayoutItems();
  return {
    id,
    viewBoxWidth: DEFAULT_VIEW_BOX_WIDTH,
    viewBoxHeight: DEFAULT_VIEW_BOX_HEIGHT,
    backgroundVersion: DEFAULT_BACKGROUND_VERSION,
    items,
    sceneZones: { ...DEFAULT_FLOOR_SCENE_ZONES },
    totalChairs: sumChairs(items),
    updatedAt: null,
    isDefault: true,
    hasLegacyItems: false,
  };
}

export function mapLayoutRow(
  row: Pick<
    FloorLayoutRow,
    | 'id'
    | 'viewBoxWidth'
    | 'viewBoxHeight'
    | 'backgroundVersion'
    | 'items'
    | 'sceneZones'
    | 'updatedAt'
  >,
): FloorLayoutMapped {
  const items = parseItems(row.items);
  const hasLegacyItems = hasLegacyItemsRaw(row.items);
  const sceneZones = mergeFloorSceneZones(row.sceneZones);
  return {
    id: row.id,
    viewBoxWidth: row.viewBoxWidth,
    viewBoxHeight: row.viewBoxHeight,
    backgroundVersion: row.backgroundVersion,
    items,
    sceneZones,
    totalChairs: sumChairs(items),
    updatedAt: row.updatedAt,
    isDefault: false,
    hasLegacyItems,
  };
}

/** Merge live unitPrice values onto standalone_chair items. */
export function enrichItemsWithChairPrices(
  items: PlacedLayoutItem[],
  priceById: Map<string, number>,
): PlacedLayoutItem[] {
  return items.map((item) =>
    item.kind === 'standalone_chair'
      ? {
          ...item,
          unitPrice: priceById.get(item.venueStandaloneChairId) ?? 0,
        }
      : item,
  );
}

/**
 * Apply price map to raw JSON items (preserves unknown fields).
 * Returns `{ items, changed }`.
 */
export function applyChairPricesToRawItems(
  rawItems: unknown[],
  priceById: Map<string, number>,
): { items: unknown[]; changed: boolean } {
  let changed = false;
  const items = rawItems.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const o = entry as Record<string, unknown>;
    if (
      o.kind !== 'standalone_chair' ||
      typeof o.venueStandaloneChairId !== 'string'
    ) {
      return entry;
    }
    const nextPrice = priceById.get(o.venueStandaloneChairId);
    if (nextPrice === undefined) return entry;
    const current =
      typeof o.unitPrice === 'number' && Number.isFinite(o.unitPrice)
        ? o.unitPrice
        : undefined;
    if (current === nextPrice) return entry;
    changed = true;
    return { ...o, unitPrice: nextPrice };
  });
  return { items, changed };
}

export function collectStandaloneChairIdsFromRaw(
  rawItems: unknown[],
): Set<string> {
  const chairIds = new Set<string>();
  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') continue;
    const o = entry as Record<string, unknown>;
    if (
      o.kind === 'standalone_chair' &&
      typeof o.venueStandaloneChairId === 'string'
    ) {
      chairIds.add(o.venueStandaloneChairId);
    }
  }
  return chairIds;
}
