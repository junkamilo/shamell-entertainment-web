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
