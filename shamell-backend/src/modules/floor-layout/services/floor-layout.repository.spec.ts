import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  makeFloorLayoutRow,
  makePlacedCatalogTable,
} from '../__mocks__/floor-layout.fixtures';
import { FloorLayoutRepository } from './floor-layout.repository';

describe('FloorLayoutRepository', () => {
  let repository: FloorLayoutRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FloorLayoutRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(FloorLayoutRepository);
  });

  it('findActiveLayout queries active layout ordered by updatedAt', async () => {
    const row = makeFloorLayoutRow();
    prisma.venueFloorLayout.findFirst.mockResolvedValue(row);
    await expect(repository.findActiveLayout()).resolves.toEqual(row);
    expect(prisma.venueFloorLayout.findFirst).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('findLayoutById delegates to findUnique', async () => {
    const row = makeFloorLayoutRow();
    prisma.venueFloorLayout.findUnique.mockResolvedValue(row);
    await expect(repository.findLayoutById('layout-1')).resolves.toEqual(row);
    expect(prisma.venueFloorLayout.findUnique).toHaveBeenCalledWith({
      where: { id: 'layout-1' },
    });
  });

  it('findClientSettings orders by updatedAt', async () => {
    prisma.venueLayoutClientSettings.findFirst.mockResolvedValue({
      clientEnabled: true,
    });
    await expect(repository.findClientSettings()).resolves.toMatchObject({
      clientEnabled: true,
    });
    expect(prisma.venueLayoutClientSettings.findFirst).toHaveBeenCalledWith({
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('countClientEnabledUpcomingConfigs counts published events', async () => {
    prisma.upcomingVenueConfig.count.mockResolvedValue(2);
    await expect(repository.countClientEnabledUpcomingConfigs()).resolves.toBe(
      2,
    );
    expect(prisma.upcomingVenueConfig.count).toHaveBeenCalledWith({
      where: { clientEnabled: true },
    });
  });

  it('findActiveTablesForPalette selects palette fields', async () => {
    prisma.venueTableConfig.findMany.mockResolvedValue([]);
    await repository.findActiveTablesForPalette();
    expect(prisma.venueTableConfig.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { tableName: 'asc' }],
      select: {
        id: true,
        tableName: true,
        size: true,
        includedChairs: true,
        sortOrder: true,
      },
    });
  });

  it('findActiveChairsForPalette selects palette fields', async () => {
    prisma.venueStandaloneChair.findMany.mockResolvedValue([]);
    await repository.findActiveChairsForPalette();
    expect(prisma.venueStandaloneChair.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        chairName: true,
        unitPrice: true,
        sortOrder: true,
      },
    });
  });

  it('updateLayoutItems updates items JSON', async () => {
    const row = makeFloorLayoutRow();
    prisma.venueFloorLayout.update.mockResolvedValue(row);
    const items = [makePlacedCatalogTable()] as never;
    await expect(
      repository.updateLayoutItems('layout-1', items),
    ).resolves.toEqual(row);
    expect(prisma.venueFloorLayout.update).toHaveBeenCalledWith({
      where: { id: 'layout-1' },
      data: { items },
    });
  });

  it('upsertLayoutWithSideEffects runs transaction for create', async () => {
    const created = makeFloorLayoutRow();
    const tx = {
      venueFloorLayout: {
        create: jest.fn().mockResolvedValue(created),
        update: jest.fn(),
      },
      venueTableConfig: {
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      upcomingVenueConfig: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prisma.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) =>
      Promise.resolve(fn(tx)),
    );

    const items = [makePlacedCatalogTable()];
    const result = await repository.upsertLayoutWithSideEffects({
      existingId: null,
      data: {
        viewBoxWidth: 614,
        viewBoxHeight: 944,
        backgroundVersion: 'v1',
        items: items,
        sceneZones: {},
      },
      items,
    });

    expect(result).toEqual(created);
    expect(tx.venueFloorLayout.create).toHaveBeenCalled();
    expect(tx.venueTableConfig.update).toHaveBeenCalled();
    expect(tx.upcomingVenueConfig.updateMany).toHaveBeenCalledWith({
      where: { floorLayoutId: null },
      data: { floorLayoutId: created.id },
    });
  });
});
