import type { Prisma } from '@prisma/client';
import type { PlacedLayoutItem } from '../../floor-layout/types/floor-layout.types';
import type {
  MappedStandaloneChair,
  StandaloneChairPublicListItem,
  StandaloneChairRow,
} from '../types/standalone-chairs.types';
import { STANDALONE_CHAIR_DISPLAY_LABEL } from './standalone-chair-names.util';

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : Number(value.toString());
}

export function mapChairRow(row: StandaloneChairRow): MappedStandaloneChair {
  return {
    id: row.id,
    chairName: row.chairName,
    displayLabel: STANDALONE_CHAIR_DISPLAY_LABEL,
    unitPrice: decimalToNumber(row.unitPrice),
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapPublicChairListItem(row: {
  id: string;
  unitPrice: Prisma.Decimal | number;
  chairName: string;
  sortOrder: number;
}): StandaloneChairPublicListItem {
  return {
    id: row.id,
    unitPrice: decimalToNumber(row.unitPrice),
    chairName: row.chairName,
    sortOrder: row.sortOrder,
    isActive: true,
  };
}

export function parseLayoutItems(raw: Prisma.JsonValue): PlacedLayoutItem[] {
  if (!Array.isArray(raw)) return [];
  const output: PlacedLayoutItem[] = [];
  for (const candidate of raw) {
    if (!candidate || typeof candidate !== 'object') continue;
    const item = candidate as Record<string, unknown>;
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
          typeof item.chairName === 'string'
            ? item.chairName
            : STANDALONE_CHAIR_DISPLAY_LABEL,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
      });
    }
  }
  return output;
}

export function collectPlacedStandaloneChairIds(
  raw: Prisma.JsonValue,
): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(raw)) return ids;

  for (const candidate of raw) {
    if (!candidate || typeof candidate !== 'object') continue;
    const item = candidate as Record<string, unknown>;
    if (
      item.kind === 'standalone_chair' &&
      typeof item.venueStandaloneChairId === 'string'
    ) {
      ids.add(item.venueStandaloneChairId);
    }
  }
  return ids;
}
