import type { Prisma } from '@prisma/client';
import type { PlacedLayoutItem } from '../../floor-layout/types/floor-layout.types';
import type {
  MappedVenueTable,
  VenueTableConfigRow,
} from '../types/venue-tables.types';
import { formatVenueTableSizeLabel } from './venue-table-names.util';

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value.toString());
}

export function mapVenueTableRow(row: VenueTableConfigRow): MappedVenueTable {
  return {
    id: row.id,
    tableName: row.tableName,
    displayLabel: formatVenueTableSizeLabel(row.size),
    size: row.size,
    includedChairs: row.includedChairs,
    bundlePrice: decimalToNumber(row.bundlePrice),
    visualCoordinates:
      row.visualX != null && row.visualY != null
        ? { x: row.visualX, y: row.visualY }
        : null,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function parseLayoutItems(raw: Prisma.JsonValue): PlacedLayoutItem[] {
  if (!Array.isArray(raw)) return [];
  const output: PlacedLayoutItem[] = [];
  for (const candidate of raw) {
    if (!candidate || typeof candidate !== 'object') continue;
    const item = candidate as Record<string, unknown>;
    if (
      item.kind === 'catalog_table' &&
      typeof item.id === 'string' &&
      typeof item.venueTableConfigId === 'string' &&
      typeof item.tableName === 'string' &&
      typeof item.size === 'string' &&
      typeof item.includedChairs === 'number' &&
      typeof item.x === 'number' &&
      typeof item.y === 'number' &&
      typeof item.rotation === 'number'
    ) {
      output.push({
        id: item.id,
        kind: 'catalog_table',
        venueTableConfigId: item.venueTableConfigId,
        tableName: item.tableName,
        size: item.size as 'LARGE' | 'MEDIUM' | 'SMALL',
        includedChairs: item.includedChairs,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
      });
      continue;
    }
    if (
      item.kind === 'standalone_chair' &&
      typeof item.id === 'string' &&
      typeof item.venueStandaloneChairId === 'string' &&
      typeof item.x === 'number' &&
      typeof item.y === 'number' &&
      typeof item.rotation === 'number'
    ) {
      output.push({
        id: item.id,
        kind: 'standalone_chair',
        venueStandaloneChairId: item.venueStandaloneChairId,
        chairName:
          typeof item.chairName === 'string' ? item.chairName : 'Chair',
        x: item.x,
        y: item.y,
        rotation: item.rotation,
      });
    }
  }
  return output;
}
