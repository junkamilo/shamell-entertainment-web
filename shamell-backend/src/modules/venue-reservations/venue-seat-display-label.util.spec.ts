import { VenueSeatKind, VenueTableSize } from '@prisma/client';
import {
  formatChairDisplayLabel,
  formatTableDisplayLabel,
  isTechnicalChairName,
  isTechnicalTableName,
  resolveVenueSeatDisplayLabel,
  toShortSeatDisplayLabel,
} from './venue-seat-display-label.util';

describe('venue-seat-display-label.util', () => {
  it('detects technical table and chair slugs', () => {
    expect(isTechnicalTableName('MEDIUM-a1b2c3d4')).toBe(true);
    expect(isTechnicalTableName('Mesa 1')).toBe(false);
    expect(isTechnicalChairName('CHAIR-deadbeef')).toBe(true);
    expect(isTechnicalChairName('Chair 2')).toBe(false);
  });

  it('formats friendly English labels', () => {
    expect(formatTableDisplayLabel(VenueTableSize.LARGE, 1)).toBe('Large table 1');
    expect(formatChairDisplayLabel(3)).toBe('Chair 3');
    expect(toShortSeatDisplayLabel('Large table 4')).toBe('Large 4');
  });

  it('uses custom table name when not technical', async () => {
    const label = await resolveVenueSeatDisplayLabel(
      {
        venueTableConfig: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
        },
        venueStandaloneChair: { findFirst: jest.fn(), findMany: jest.fn() },
      },
      { getPublicFloorLayoutForClient: jest.fn() },
      {
        kind: VenueSeatKind.CATALOG_TABLE,
        layoutItemId: 'layout-1',
        venueTableConfigId: 'table-1',
        venueTableConfig: {
          id: 'table-1',
          tableName: 'VIP table',
          size: VenueTableSize.LARGE,
        },
      },
    );
    expect(label).toBe('VIP table');
  });

  it('numbers tables of the same size by sort order', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'table-a' },
      { id: 'table-b' },
      { id: 'table-c' },
    ]);
    const label = await resolveVenueSeatDisplayLabel(
      {
        venueTableConfig: { findFirst: jest.fn(), findMany },
        venueStandaloneChair: { findFirst: jest.fn(), findMany: jest.fn() },
      },
      { getPublicFloorLayoutForClient: jest.fn() },
      {
        kind: VenueSeatKind.CATALOG_TABLE,
        layoutItemId: 'layout-2',
        venueTableConfigId: 'table-b',
        venueTableConfig: {
          id: 'table-b',
          tableName: 'MEDIUM-abc12345',
          size: VenueTableSize.MEDIUM,
        },
      },
    );
    expect(label).toBe('Medium table 2');
    expect(findMany).toHaveBeenCalled();
  });

  it('numbers standalone chairs by sort order', async () => {
    const findMany = jest.fn().mockResolvedValue([
      { id: 'chair-1' },
      { id: 'chair-2' },
    ]);
    const findFirst = jest.fn().mockResolvedValue({
      id: 'chair-2',
      chairName: 'CHAIR-abc12345',
      sortOrder: 1,
    });
    const label = await resolveVenueSeatDisplayLabel(
      {
        venueTableConfig: { findFirst: jest.fn(), findMany: jest.fn() },
        venueStandaloneChair: { findFirst, findMany },
      },
      { getPublicFloorLayoutForClient: jest.fn() },
      {
        kind: VenueSeatKind.STANDALONE_CHAIR,
        layoutItemId: 'layout-chair',
        venueTableConfigId: null,
        venueStandaloneChairId: 'chair-2',
      },
    );
    expect(label).toBe('Chair 2');
  });
});
