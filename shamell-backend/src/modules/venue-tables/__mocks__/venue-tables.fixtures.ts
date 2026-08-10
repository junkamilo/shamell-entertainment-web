import { VenueTableSize } from '@prisma/client';
import type { VenueTableConfigRow } from '../types/venue-tables.types';

const NOW = new Date('2026-01-15T12:00:00.000Z');

export function makeVenueTableConfigRow(
  overrides: Partial<VenueTableConfigRow> = {},
): VenueTableConfigRow {
  return {
    id: 'table-1',
    tableName: 'LARGE-abcd1234',
    size: VenueTableSize.LARGE,
    includedChairs: 6,
    bundlePrice: 150,
    visualX: null,
    visualY: null,
    isActive: true,
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

/** Valid catalog_table JSON item for parseLayoutItems. */
export function makeCatalogTableLayoutItemJson(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'layout-table-1',
    kind: 'catalog_table',
    venueTableConfigId: 'table-1',
    tableName: 'LARGE-abcd1234',
    size: 'LARGE',
    includedChairs: 6,
    x: 10,
    y: 20,
    rotation: 0,
    ...overrides,
  };
}

/** Valid standalone_chair JSON item for parseLayoutItems. */
export function makeStandaloneChairLayoutItemJson(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'layout-chair-1',
    kind: 'standalone_chair',
    venueStandaloneChairId: 'chair-1',
    chairName: 'Chair A',
    x: 5,
    y: 8,
    rotation: 45,
    ...overrides,
  };
}

/** Incomplete catalog_table (missing venueTableConfigId) — skipped by parser. */
export function makeIncompleteCatalogTableLayoutItemJson(
  overrides: Record<string, unknown> = {},
) {
  return makeCatalogTableLayoutItemJson({
    venueTableConfigId: undefined,
    ...overrides,
  });
}
