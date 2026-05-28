import { VenueTableSize } from '@prisma/client';
import {
  buildTechnicalTableName,
  formatVenueTableSizeLabel,
  generateTechnicalTableNameEntries,
} from './venue-table-names.util';

describe('venue-table-names.util', () => {
  it('formats size labels for display', () => {
    expect(formatVenueTableSizeLabel(VenueTableSize.LARGE)).toBe('Large');
    expect(formatVenueTableSizeLabel(VenueTableSize.MEDIUM)).toBe('Medium');
    expect(formatVenueTableSizeLabel(VenueTableSize.SMALL)).toBe('Small');
  });

  it('builds technical names scoped by size and id', () => {
    const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    expect(buildTechnicalTableName(VenueTableSize.LARGE, id)).toBe(
      'LARGE-a1b2c3d4',
    );
    expect(buildTechnicalTableName(VenueTableSize.MEDIUM, id)).toBe(
      'MEDIUM-a1b2c3d4',
    );
  });

  it('generates unique entries for bulk create across sizes', () => {
    const large = generateTechnicalTableNameEntries(VenueTableSize.LARGE, 10);
    const medium = generateTechnicalTableNameEntries(VenueTableSize.MEDIUM, 10);

    const allNames = new Set([
      ...large.map((e) => e.tableName),
      ...medium.map((e) => e.tableName),
    ]);
    expect(allNames.size).toBe(20);

    for (const entry of large) {
      expect(entry.tableName.startsWith('LARGE-')).toBe(true);
    }
    for (const entry of medium) {
      expect(entry.tableName.startsWith('MEDIUM-')).toBe(true);
    }
  });

  it('does not reuse table names within a single bulk batch', () => {
    const batch = generateTechnicalTableNameEntries(VenueTableSize.LARGE, 5);
    const names = batch.map((e) => e.tableName);
    expect(new Set(names).size).toBe(5);
  });
});
