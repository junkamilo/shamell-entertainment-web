import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeChairConfig,
  makeChairRow,
  makeLayoutChairItem,
  makePaidReservation,
} from '../__mocks__/standalone-chairs.fixtures';
import { StandaloneChairsRepository } from './standalone-chairs.repository';

describe('StandaloneChairsRepository', () => {
  let repository: StandaloneChairsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StandaloneChairsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(StandaloneChairsRepository);
  });

  it('findActiveConfig and countActiveChairs', async () => {
    const config = makeChairConfig();
    prisma.venueStandaloneChairConfig.findFirst.mockResolvedValue(config);
    prisma.venueStandaloneChair.count.mockResolvedValue(2);
    await expect(repository.findActiveConfig()).resolves.toEqual(config);
    await expect(repository.countActiveChairs()).resolves.toBe(2);
  });

  it('findActiveChairsPublic selects public fields', async () => {
    const publicRows = [
      {
        id: 'chair-1',
        unitPrice: 25,
        chairName: 'Chair 1',
        sortOrder: 0,
      },
    ];
    prisma.venueStandaloneChair.findMany.mockResolvedValue(publicRows);
    await expect(repository.findActiveChairsPublic()).resolves.toEqual(
      publicRows,
    );
    expect(prisma.venueStandaloneChair.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          unitPrice: true,
          chairName: true,
          sortOrder: true,
        },
      }),
    );
  });

  it('findActiveChairsDesc orders descending', async () => {
    prisma.venueStandaloneChair.findMany.mockResolvedValue([makeChairRow()]);
    await repository.findActiveChairsDesc();
    expect(prisma.venueStandaloneChair.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
      }),
    );
  });

  it('findActiveChairById / findActiveChairIds / findFirstActiveChair', async () => {
    const row = makeChairRow();
    prisma.venueStandaloneChair.findFirst
      .mockResolvedValueOnce(row)
      .mockResolvedValueOnce(row);
    prisma.venueStandaloneChair.findMany.mockResolvedValue([{ id: 'chair-1' }]);

    await expect(repository.findActiveChairById('chair-1')).resolves.toEqual(
      row,
    );
    await expect(repository.findActiveChairIds()).resolves.toEqual([
      { id: 'chair-1' },
    ]);
    await expect(repository.findFirstActiveChair()).resolves.toEqual(row);
  });

  it('updateChairUnitPrice and deleteChair', async () => {
    prisma.venueStandaloneChair.update.mockResolvedValue({});
    prisma.venueStandaloneChair.delete.mockResolvedValue({});
    await repository.updateChairUnitPrice('chair-1', 30);
    await repository.deleteChair('chair-1');
    expect(prisma.venueStandaloneChair.update).toHaveBeenCalled();
    expect(prisma.venueStandaloneChair.delete).toHaveBeenCalledWith({
      where: { id: 'chair-1' },
    });
  });

  it('maxSortOrder uses aggregate', async () => {
    prisma.venueStandaloneChair.aggregate.mockResolvedValue({
      _max: { sortOrder: 4 },
    });
    await expect(repository.maxSortOrder()).resolves.toBe(4);
  });

  it('maxSortOrder returns -1 when empty', async () => {
    prisma.venueStandaloneChair.aggregate.mockResolvedValue({
      _max: { sortOrder: null },
    });
    await expect(repository.maxSortOrder()).resolves.toBe(-1);
  });

  it('createChairsFromEntries creates rows in a transaction', async () => {
    const tx = {
      venueStandaloneChair: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof tx) => Promise<void>) => fn(tx),
    );

    await repository.createChairsFromEntries(
      [
        { id: 'c1', chairName: 'Chair 1' },
        { id: 'c2', chairName: 'Chair 2' },
      ],
      25,
      0,
    );

    expect(tx.venueStandaloneChair.create).toHaveBeenCalledTimes(2);
    expect(tx.venueStandaloneChair.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        id: 'c1',
        sortOrder: 0,
        unitPrice: 25,
      }) as Record<string, unknown>,
    });
    expect(tx.venueStandaloneChair.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        id: 'c2',
        sortOrder: 1,
      }) as Record<string, unknown>,
    });
  });

  it('updateAllActiveUnitPrices updates many', async () => {
    prisma.venueStandaloneChair.updateMany.mockResolvedValue({ count: 2 });
    await repository.updateAllActiveUnitPrices(40);
    expect(prisma.venueStandaloneChair.updateMany).toHaveBeenCalledWith({
      where: { isActive: true },
      data: { unitPrice: 40 },
    });
  });

  it('deleteChairsByIds no-ops on empty and deletes bulk', async () => {
    prisma.venueStandaloneChair.deleteMany.mockResolvedValue({ count: 0 });
    await repository.deleteChairsByIds([]);
    expect(prisma.venueStandaloneChair.deleteMany).not.toHaveBeenCalled();

    await repository.deleteChairsByIds(['a', 'b']);
    expect(prisma.venueStandaloneChair.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['a', 'b'] } },
    });
  });

  it('updateConfigQuantity with and without unitPrice', async () => {
    prisma.venueStandaloneChairConfig.update.mockResolvedValue({});
    await repository.updateConfigQuantity('cfg-1', 3);
    expect(prisma.venueStandaloneChairConfig.update).toHaveBeenCalledWith({
      where: { id: 'cfg-1' },
      data: { availableQuantity: 3 },
    });

    await repository.updateConfigQuantity('cfg-1', 4, 55);
    expect(prisma.venueStandaloneChairConfig.update).toHaveBeenCalledWith({
      where: { id: 'cfg-1' },
      data: { availableQuantity: 4, unitPrice: 55 },
    });
  });

  it('cleanupDeletedChairReferencesFromLayout updates layout', async () => {
    prisma.venueFloorLayout.findFirst.mockResolvedValue({
      id: 'layout-1',
      items: [makeLayoutChairItem()],
    });
    prisma.venueFloorLayout.update.mockResolvedValue({});
    await repository.cleanupDeletedChairReferencesFromLayout(['chair-1']);
    expect(prisma.venueFloorLayout.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'layout-1' },
        data: { items: [] },
      }),
    );
  });

  it('createConfig and findActiveChairs', async () => {
    prisma.venueStandaloneChairConfig.create.mockResolvedValue({});
    prisma.venueStandaloneChair.findMany.mockResolvedValue([makeChairRow()]);
    await repository.createConfig(2, 25);
    await expect(repository.findActiveChairs()).resolves.toHaveLength(1);
  });

  it('findActiveLayout selects active layout', async () => {
    const layout = { id: 'layout-1', items: [] };
    prisma.venueFloorLayout.findFirst.mockResolvedValue(layout);
    await expect(repository.findActiveLayout()).resolves.toEqual(layout);
  });

  it('findPaidStandaloneChairReservations delegates', async () => {
    prisma.venueSeatReservation.findMany.mockResolvedValue([
      makePaidReservation(),
    ]);
    const rows = await repository.findPaidStandaloneChairReservations();
    expect(Array.isArray(rows)).toBe(true);
    expect(prisma.venueSeatReservation.findMany).toHaveBeenCalled();
  });

  it('getPlacedStandaloneChairIds returns empty Set without layout', async () => {
    prisma.venueFloorLayout.findFirst.mockResolvedValue(null);
    await expect(repository.getPlacedStandaloneChairIds()).resolves.toEqual(
      new Set(),
    );
  });

  it('getPlacedStandaloneChairIds collects placed chair ids', async () => {
    prisma.venueFloorLayout.findFirst.mockResolvedValue({
      id: 'layout-1',
      items: [makeLayoutChairItem({ venueStandaloneChairId: 'chair-1' })],
    });
    const ids = await repository.getPlacedStandaloneChairIds();
    expect(ids.has('chair-1')).toBe(true);
  });

  it('getActiveLayoutItems returns [] without layout and parses when present', async () => {
    prisma.venueFloorLayout.findFirst.mockResolvedValueOnce(null);
    await expect(repository.getActiveLayoutItems()).resolves.toEqual([]);

    prisma.venueFloorLayout.findFirst.mockResolvedValueOnce({
      id: 'layout-1',
      items: [makeLayoutChairItem()],
    });
    const items = await repository.getActiveLayoutItems();
    expect(items).toHaveLength(1);
    expect(items[0].kind).toBe('standalone_chair');
  });
});
