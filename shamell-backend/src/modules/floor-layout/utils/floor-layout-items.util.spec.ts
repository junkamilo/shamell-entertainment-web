import {
  chairCountForItem,
  hasLegacyItemsRaw,
  isLegacyLayoutKind,
  normalizeItems,
  parseItems,
  parseItemsLenient,
  sumChairs,
} from './floor-layout-items.util';
import {
  makePlacedCatalogTable,
  makePlacedStandaloneChair,
} from '../__mocks__/floor-layout.fixtures';
import { BadRequestException } from '@nestjs/common';

describe('floor-layout-items.util', () => {
  it('isLegacyLayoutKind detects legacy kinds', () => {
    expect(isLegacyLayoutKind('big_table')).toBe(true);
    expect(isLegacyLayoutKind('catalog_table')).toBe(false);
  });

  it('parseItemsLenient parses valid items and skips legacy', () => {
    const items = parseItemsLenient([
      makePlacedCatalogTable(),
      { id: 'legacy-1', kind: 'big_table', x: 1, y: 2, rotation: 0 },
      makePlacedStandaloneChair(),
      { id: 'bad', kind: 'catalog_table', x: 'nope' },
    ]);
    expect(items).toHaveLength(2);
    expect(items[0].kind).toBe('catalog_table');
    expect(items[1].kind).toBe('standalone_chair');
  });

  it('parseItems filters any legacy that slipped through', () => {
    const items = parseItems([
      makePlacedCatalogTable({ includedChairs: 6 }),
      { id: 'legacy-1', kind: 'bench', x: 1, y: 2, rotation: 0 },
    ]);
    expect(items).toHaveLength(1);
    expect(sumChairs(items)).toBe(6);
  });

  it('hasLegacyItemsRaw detects legacy entries in raw JSON', () => {
    expect(hasLegacyItemsRaw([{ kind: 'stage' }])).toBe(true);
    expect(hasLegacyItemsRaw([makePlacedCatalogTable()])).toBe(false);
  });

  it('chairCountForItem and sumChairs', () => {
    expect(
      chairCountForItem(makePlacedCatalogTable({ includedChairs: 10 })),
    ).toBe(10);
    expect(chairCountForItem(makePlacedStandaloneChair())).toBe(1);
    expect(
      sumChairs([
        makePlacedCatalogTable({ includedChairs: 4 }),
        makePlacedStandaloneChair(),
      ]),
    ).toBe(5);
  });

  it('normalizeItems rejects legacy kinds', () => {
    expect(() =>
      normalizeItems(
        [{ id: 'a', kind: 'big_table', x: 10, y: 10, rotation: 0 }],
        614,
        944,
        {
          tables: [],
          chairs: [],
          tableDisplayLabel: () => 'Large',
          chairDisplayLabel: 'Chair',
        },
      ),
    ).toThrow(BadRequestException);
  });

  it('normalizeItems resolves catalog table from ids', () => {
    const result = normalizeItems(
      [
        {
          id: '11111111-1111-4111-8111-111111111111',
          kind: 'catalog_table',
          venueTableConfigId: 'table-1',
          x: 100,
          y: 200,
          rotation: 0,
        },
      ],
      614,
      944,
      {
        tables: [{ id: 'table-1', size: 'LARGE', includedChairs: 8 }],
        chairs: [],
        tableDisplayLabel: (size) => size,
        chairDisplayLabel: 'Chair',
      },
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      kind: 'catalog_table',
      venueTableConfigId: 'table-1',
      includedChairs: 8,
    });
  });
});
