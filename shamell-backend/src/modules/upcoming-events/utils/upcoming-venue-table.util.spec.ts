import { VenueSeatReservationStatus } from '@prisma/client';
import {
  loadCatalogTableLayoutItemIds,
  venueTablePublicStats,
} from './upcoming-venue-table.util';

describe('upcoming-venue-table.util', () => {
  it('loadCatalogTableLayoutItemIds parses catalog_table items', async () => {
    const prisma = {
      venueFloorLayout: {
        findUnique: jest.fn().mockResolvedValue({
          items: [
            { kind: 'catalog_table', id: 't1' },
            { kind: 'standalone_chair', id: 'c1' },
            { kind: 'catalog_table', id: 't2' },
          ],
        }),
        findFirst: jest.fn(),
      },
      venueSeatReservation: { findMany: jest.fn() },
    };

    await expect(
      loadCatalogTableLayoutItemIds(prisma, 'layout-1'),
    ).resolves.toEqual(['t1', 't2']);
    expect(prisma.venueFloorLayout.findUnique).toHaveBeenCalled();
  });

  it('venueTablePublicStats returns zeros when no tables', async () => {
    const prisma = {
      venueFloorLayout: {
        findUnique: jest.fn().mockResolvedValue({ items: [] }),
        findFirst: jest.fn(),
      },
      venueSeatReservation: { findMany: jest.fn() },
    };
    await expect(
      venueTablePublicStats(prisma, {
        eventId: 'e1',
        eventDate: new Date('2026-08-01T00:00:00.000Z'),
        floorLayoutId: 'layout-1',
      }),
    ).resolves.toEqual({
      tableCapacity: 0,
      tablesRemaining: 0,
      tablesSold: 0,
    });
    expect(prisma.venueSeatReservation.findMany).not.toHaveBeenCalled();
  });

  it('venueTablePublicStats counts sold vs remaining', async () => {
    const eventDate = new Date('2026-08-01T00:00:00.000Z');
    const prisma = {
      venueFloorLayout: {
        findUnique: jest.fn().mockResolvedValue({
          items: [
            { kind: 'catalog_table', id: 't1' },
            { kind: 'catalog_table', id: 't2' },
          ],
        }),
        findFirst: jest.fn(),
      },
      venueSeatReservation: {
        findMany: jest.fn().mockResolvedValue([{ layoutItemId: 't1' }]),
      },
    };

    await expect(
      venueTablePublicStats(prisma, {
        eventId: 'e1',
        eventDate,
        floorLayoutId: 'layout-1',
      }),
    ).resolves.toEqual({
      tableCapacity: 2,
      tablesRemaining: 1,
      tablesSold: 1,
    });
    expect(prisma.venueSeatReservation.findMany).toHaveBeenCalled();
    const findManyCalls = prisma.venueSeatReservation.findMany.mock
      .calls as unknown as Array<
      [
        {
          where: {
            status: VenueSeatReservationStatus;
            layoutItemId: { in: string[] };
          };
        },
      ]
    >;
    expect(findManyCalls[0]?.[0]?.where.status).toBe(
      VenueSeatReservationStatus.PAID,
    );
    expect(findManyCalls[0]?.[0]?.where.layoutItemId).toEqual({
      in: ['t1', 't2'],
    });
  });
});
