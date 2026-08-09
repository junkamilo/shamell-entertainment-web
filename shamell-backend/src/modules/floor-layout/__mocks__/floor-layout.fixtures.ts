import type {
  FloorLayoutMapped,
  FloorLayoutPalette,
  FloorLayoutRow,
  PlacedLayoutItem,
} from '../types/floor-layout.types';
import { DEFAULT_FLOOR_SCENE_ZONES } from '../utils/floor-scene-zones.util';

const NOW = new Date('2026-06-01T12:00:00.000Z');

export function makePlacedCatalogTable(
  overrides: Partial<Extract<PlacedLayoutItem, { kind: 'catalog_table' }>> = {},
): Extract<PlacedLayoutItem, { kind: 'catalog_table' }> {
  return {
    id: 'item-table-1',
    kind: 'catalog_table',
    venueTableConfigId: 'table-1',
    tableName: 'Large',
    size: 'LARGE',
    includedChairs: 8,
    x: 100,
    y: 200,
    rotation: 0,
    ...overrides,
  };
}

export function makePlacedStandaloneChair(
  overrides: Partial<
    Extract<PlacedLayoutItem, { kind: 'standalone_chair' }>
  > = {},
): Extract<PlacedLayoutItem, { kind: 'standalone_chair' }> {
  return {
    id: 'item-chair-1',
    kind: 'standalone_chair',
    venueStandaloneChairId: 'chair-1',
    chairName: 'Chair',
    x: 50,
    y: 60,
    rotation: 0,
    ...overrides,
  };
}

export function makeFloorLayoutRow(
  overrides: Partial<FloorLayoutRow> & { items?: unknown } = {},
): FloorLayoutRow {
  const { items, ...rest } = overrides;
  return {
    id: 'layout-1',
    viewBoxWidth: 614,
    viewBoxHeight: 944,
    backgroundVersion: 'v1',
    items: items ?? [makePlacedCatalogTable()],
    sceneZones: { ...DEFAULT_FLOOR_SCENE_ZONES },
    isActive: true,
    updatedAt: NOW,
    createdAt: NOW,
    ...rest,
  };
}

export function makeFloorLayoutMapped(
  overrides: Partial<FloorLayoutMapped> = {},
): FloorLayoutMapped {
  return {
    id: 'layout-1',
    viewBoxWidth: 614,
    viewBoxHeight: 944,
    backgroundVersion: 'v1',
    items: [makePlacedCatalogTable()],
    sceneZones: { ...DEFAULT_FLOOR_SCENE_ZONES },
    totalChairs: 8,
    updatedAt: NOW,
    isDefault: false,
    hasLegacyItems: false,
    ...overrides,
  };
}

export function makeFloorLayoutPalette(
  overrides: Partial<FloorLayoutPalette> = {},
): FloorLayoutPalette {
  return {
    tablesBySize: { LARGE: 1, MEDIUM: 0, SMALL: 0 },
    standaloneChairsAvailable: 1,
    unplacedTables: [
      {
        id: 'table-2',
        tableName: 'LARGE-abcd1234',
        displayLabel: 'Large',
        size: 'LARGE',
        includedChairs: 8,
        sortOrder: 0,
      },
    ],
    unplacedChairs: [
      {
        id: 'chair-2',
        chairName: 'CHAIR-abcd1234',
        displayLabel: 'Chair',
        unitPrice: 25,
        sortOrder: 0,
      },
    ],
    placedTableIds: ['table-1'],
    placedChairIds: [],
    placedChairCount: 0,
    ...overrides,
  };
}
