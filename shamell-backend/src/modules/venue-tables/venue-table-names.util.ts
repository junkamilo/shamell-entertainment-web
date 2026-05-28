import { randomUUID } from 'crypto';
import { VenueTableSize } from '@prisma/client';

export const VENUE_TABLE_SIZE_LABELS: Record<VenueTableSize, string> = {
  [VenueTableSize.LARGE]: 'Large',
  [VenueTableSize.MEDIUM]: 'Medium',
  [VenueTableSize.SMALL]: 'Small',
};

export function formatVenueTableSizeLabel(size: VenueTableSize | string): string {
  const label = VENUE_TABLE_SIZE_LABELS[size as VenueTableSize];
  return label ?? String(size);
}

/** Unique technical slug stored in DB; not shown to end users. */
export function buildTechnicalTableName(size: VenueTableSize, id: string): string {
  const shortId = id.replace(/-/g, '').slice(0, 8).toLowerCase();
  return `${size}-${shortId}`;
}

export type TechnicalTableNameEntry = {
  id: string;
  tableName: string;
};

export function generateTechnicalTableNameEntries(
  size: VenueTableSize,
  quantity: number,
): TechnicalTableNameEntry[] {
  return Array.from({ length: quantity }, () => {
    const id = randomUUID();
    return {
      id,
      tableName: buildTechnicalTableName(size, id),
    };
  });
}

export function findNameConflict(
  names: string[],
  existingNames: Set<string>,
): string | null {
  const normalizedExisting = new Set(
    [...existingNames].map((n) => n.trim().toLowerCase()),
  );
  for (const name of names) {
    if (normalizedExisting.has(name.trim().toLowerCase())) {
      return name;
    }
  }
  return null;
}
