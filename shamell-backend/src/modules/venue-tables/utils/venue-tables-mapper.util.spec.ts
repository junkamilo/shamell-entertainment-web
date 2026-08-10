import { Prisma, VenueTableSize } from '@prisma/client';
import {
  makeCatalogTableLayoutItemJson,
  makeIncompleteCatalogTableLayoutItemJson,
  makeStandaloneChairLayoutItemJson,
  makeVenueTableConfigRow,
} from '../__mocks__/venue-tables.fixtures';
import {
  decimalToNumber,
  mapVenueTableRow,
  parseLayoutItems,
} from './venue-tables-mapper.util';

describe('venue-tables-mapper.util', () => {
  describe('decimalToNumber', () => {
    it('passes through number values', () => {
      expect(decimalToNumber(42.5)).toBe(42.5);
    });

    it('converts Prisma.Decimal via toString', () => {
      expect(decimalToNumber(new Prisma.Decimal('99.5'))).toBe(99.5);
    });
  });

  describe('mapVenueTableRow', () => {
    it('maps row without coords to visualCoordinates null', () => {
      const mapped = mapVenueTableRow(makeVenueTableConfigRow());

      expect(mapped.visualCoordinates).toBeNull();
      expect(mapped.bundlePrice).toBe(150);
      expect(mapped.displayLabel).toBe('Large');
      expect(mapped.size).toBe(VenueTableSize.LARGE);
    });

    it('maps row with visualX and visualY to coordinates', () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({
          visualX: 12.5,
          visualY: 30,
        }),
      );

      expect(mapped.visualCoordinates).toEqual({ x: 12.5, y: 30 });
    });

    it('maps Decimal bundlePrice to number and size label', () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({
          size: VenueTableSize.MEDIUM,
          bundlePrice: new Prisma.Decimal('75.25'),
        }),
      );

      expect(mapped.bundlePrice).toBe(75.25);
      expect(mapped.displayLabel).toBe('Medium');
    });

    it('treats partial coords as null when one axis is missing', () => {
      const mapped = mapVenueTableRow(
        makeVenueTableConfigRow({
          visualX: 10,
          visualY: null,
        }),
      );

      expect(mapped.visualCoordinates).toBeNull();
    });
  });

  describe('parseLayoutItems', () => {
    it('returns empty array for non-array raw', () => {
      expect(parseLayoutItems(null)).toEqual([]);
      expect(parseLayoutItems({ kind: 'catalog_table' })).toEqual([]);
    });

    it('skips non-objects and wrong kinds', () => {
      const result = parseLayoutItems([
        null,
        'string',
        42,
        { kind: 'legacy_table', id: 'x' },
        makeCatalogTableLayoutItemJson(),
      ] as never);

      expect(result).toHaveLength(1);
      expect(result[0].kind).toBe('catalog_table');
    });

    it('accepts valid catalog_table items', () => {
      const result = parseLayoutItems([makeCatalogTableLayoutItemJson()]);

      expect(result).toEqual([
        {
          id: 'layout-table-1',
          kind: 'catalog_table',
          venueTableConfigId: 'table-1',
          tableName: 'LARGE-abcd1234',
          size: 'LARGE',
          includedChairs: 6,
          x: 10,
          y: 20,
          rotation: 0,
        },
      ]);
    });

    it('rejects incomplete catalog_table missing venueTableConfigId', () => {
      const incomplete = makeIncompleteCatalogTableLayoutItemJson();
      delete incomplete.venueTableConfigId;

      expect(parseLayoutItems([incomplete])).toEqual([]);
    });

    it('rejects catalog_table missing rotation', () => {
      const incomplete = makeCatalogTableLayoutItemJson();
      delete incomplete.rotation;

      expect(parseLayoutItems([incomplete])).toEqual([]);
    });

    it('accepts valid standalone_chair with chairName', () => {
      const result = parseLayoutItems([makeStandaloneChairLayoutItemJson()]);

      expect(result).toEqual([
        {
          id: 'layout-chair-1',
          kind: 'standalone_chair',
          venueStandaloneChairId: 'chair-1',
          chairName: 'Chair A',
          x: 5,
          y: 8,
          rotation: 45,
        },
      ]);
    });

    it('defaults chairName to Chair when missing', () => {
      const item = makeStandaloneChairLayoutItemJson();
      delete item.chairName;

      const result = parseLayoutItems([item]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          kind: 'standalone_chair',
          chairName: 'Chair',
        }),
      );
    });

    it('keeps only valid items from a mixed array in order', () => {
      const result = parseLayoutItems([
        makeIncompleteCatalogTableLayoutItemJson(),
        makeCatalogTableLayoutItemJson({ id: 't-valid' }),
        { kind: 'standalone_chair', id: 'bad-chair' },
        makeStandaloneChairLayoutItemJson({ id: 'c-valid' }),
      ] as never);

      expect(result.map((item) => item.id)).toEqual(['t-valid', 'c-valid']);
    });
  });
});
