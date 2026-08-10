import { NotFoundException } from '@nestjs/common';
import {
  makeFloorLayoutRow,
  makePlacedCatalogTable,
  makePlacedStandaloneChair,
} from '../__mocks__/floor-layout.fixtures';
import { createFloorLayoutServiceTestModule } from '../testing/floor-layout-service.test-module';
import { FloorLayoutService } from './floor-layout.service';
import type { createFloorLayoutRepositoryMock } from '../__mocks__/floor-layout.repository.mock';

describe('FloorLayoutService', () => {
  let service: FloorLayoutService;
  let repository: ReturnType<typeof createFloorLayoutRepositoryMock>;

  beforeEach(async () => {
    jest.clearAllMocks();
    const harness = await createFloorLayoutServiceTestModule();
    service = harness.service;
    repository = harness.repository;
  });

  it('getPublicFloorLayout throws when not published', async () => {
    repository.findClientSettings.mockResolvedValue({ clientEnabled: false });
    repository.countClientEnabledUpcomingConfigs.mockResolvedValue(0);
    await expect(service.getPublicFloorLayout()).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getPublicFloorLayout returns layout when clientEnabled', async () => {
    repository.findClientSettings.mockResolvedValue({ clientEnabled: true });
    repository.findActiveLayout.mockResolvedValue(null);
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([]);
    const result = await service.getPublicFloorLayout();
    expect(result.isDefault).toBe(true);
    expect(result.items).toEqual([]);
  });

  it('getPublicFloorLayout allows publish fallback via upcoming configs', async () => {
    repository.findClientSettings.mockResolvedValue({ clientEnabled: false });
    repository.countClientEnabledUpcomingConfigs.mockResolvedValue(2);
    repository.findActiveLayout.mockResolvedValue(makeFloorLayoutRow());
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([]);

    const result = await service.getPublicFloorLayout();
    expect(result.id).toBe('layout-1');
    expect(repository.countClientEnabledUpcomingConfigs).toHaveBeenCalled();
  });

  it('getAdminFloorLayout skips publish gate', async () => {
    repository.findActiveLayout.mockResolvedValue(makeFloorLayoutRow());
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([]);
    const result = await service.getAdminFloorLayout();
    expect(result.id).toBe('layout-1');
    expect(repository.findClientSettings).not.toHaveBeenCalled();
  });

  it('enrichLayoutChairPrices merges standalone chair prices', async () => {
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({
        items: [
          makePlacedStandaloneChair({
            venueStandaloneChairId: 'chair-1',
            unitPrice: 10,
          }),
        ],
      }),
    );
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([
      { id: 'chair-1', unitPrice: 45 },
    ]);

    const result = await service.getAdminFloorLayout();
    expect(repository.findActiveStandaloneChairsByIds).toHaveBeenCalledWith([
      'chair-1',
    ]);
    expect(result.items).toEqual([
      expect.objectContaining({
        kind: 'standalone_chair',
        venueStandaloneChairId: 'chair-1',
        unitPrice: 45,
      }),
    ]);
  });

  it('getAdminPalette counts unplaced inventory', async () => {
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({
        items: [makePlacedCatalogTable({ venueTableConfigId: 'table-1' })],
      }),
    );
    repository.findActiveChairsForPalette.mockResolvedValue([
      { id: 'chair-1', chairName: 'CHAIR-1', unitPrice: 20, sortOrder: 0 },
      { id: 'chair-2', chairName: 'CHAIR-2', unitPrice: 20, sortOrder: 1 },
    ]);
    repository.findActiveTablesForPalette.mockResolvedValue([
      {
        id: 'table-1',
        tableName: 'LARGE-1',
        size: 'LARGE',
        includedChairs: 8,
        sortOrder: 0,
      },
      {
        id: 'table-2',
        tableName: 'MEDIUM-1',
        size: 'MEDIUM',
        includedChairs: 6,
        sortOrder: 1,
      },
    ]);

    const palette = await service.getAdminPalette();
    expect(palette.placedTableIds).toEqual(['table-1']);
    expect(palette.unplacedTables).toHaveLength(1);
    expect(palette.unplacedTables[0].id).toBe('table-2');
    expect(palette.tablesBySize.MEDIUM).toBe(1);
    expect(palette.standaloneChairsAvailable).toBe(2);
  });

  it('getAdminPalette empty layout reports all tablesBySize unplaced', async () => {
    repository.findActiveLayout.mockResolvedValue(null);
    repository.findActiveChairsForPalette.mockResolvedValue([
      { id: 'chair-1', chairName: 'CHAIR-1', unitPrice: 20, sortOrder: 0 },
    ]);
    repository.findActiveTablesForPalette.mockResolvedValue([
      {
        id: 'table-l',
        tableName: 'LARGE-1',
        size: 'LARGE',
        includedChairs: 8,
        sortOrder: 0,
      },
      {
        id: 'table-m',
        tableName: 'MEDIUM-1',
        size: 'MEDIUM',
        includedChairs: 6,
        sortOrder: 1,
      },
      {
        id: 'table-s',
        tableName: 'SMALL-1',
        size: 'SMALL',
        includedChairs: 4,
        sortOrder: 2,
      },
    ]);

    const palette = await service.getAdminPalette();
    expect(palette.placedTableIds).toEqual([]);
    expect(palette.placedChairIds).toEqual([]);
    expect(palette.placedChairCount).toBe(0);
    expect(palette.tablesBySize).toEqual({ LARGE: 1, MEDIUM: 1, SMALL: 1 });
    expect(palette.unplacedTables).toHaveLength(3);
    expect(palette.standaloneChairsAvailable).toBe(1);
  });

  it('upsertAdminFloorLayout orchestrates normalize + repository upsert', async () => {
    repository.findAllActiveTables.mockResolvedValue([
      {
        id: 'table-1',
        tableName: 'LARGE-1',
        size: 'LARGE',
        includedChairs: 8,
        sortOrder: 0,
      },
    ]);
    repository.findAllActiveStandaloneChairs.mockResolvedValue([]);
    repository.findActiveLayout.mockResolvedValue(null);
    const saved = makeFloorLayoutRow();
    repository.upsertLayoutWithSideEffects.mockResolvedValue(saved);

    const result = await service.upsertAdminFloorLayout({
      items: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          kind: 'catalog_table',
          venueTableConfigId: 'table-1',
          x: 100,
          y: 200,
          rotation: 0,
        },
      ],
    });

    expect(repository.upsertLayoutWithSideEffects).toHaveBeenCalled();
    expect(result.id).toBe('layout-1');
    expect(result.isDefault).toBe(false);
  });

  it('isTablePlacedOnLayout returns true when table is placed', async () => {
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({
        items: [makePlacedCatalogTable({ venueTableConfigId: 'table-99' })],
      }),
    );
    await expect(service.isTablePlacedOnLayout('table-99')).resolves.toBe(true);
    await expect(service.isTablePlacedOnLayout('other')).resolves.toBe(false);
  });

  it('isTablePlacedOnLayout returns false when no layout', async () => {
    repository.findActiveLayout.mockResolvedValue(null);
    await expect(service.isTablePlacedOnLayout('table-1')).resolves.toBe(false);
  });

  it('getActiveFloorLayoutId returns null when empty', async () => {
    repository.findActiveLayout.mockResolvedValue(null);
    await expect(service.getActiveFloorLayoutId()).resolves.toBeNull();
  });

  it('getPublicFloorLayoutForClient loads by id when provided', async () => {
    repository.findLayoutById.mockResolvedValue(makeFloorLayoutRow());
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([]);
    const result = await service.getPublicFloorLayoutForClient('layout-1');
    expect(result).toMatchObject({ id: 'layout-1' });
    expect(repository.findLayoutById).toHaveBeenCalledWith('layout-1');
  });

  it('syncStandaloneChairUnitPricesInActiveLayout no-ops without chairs', async () => {
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({ items: [makePlacedCatalogTable()] }),
    );
    await service.syncStandaloneChairUnitPricesInActiveLayout();
    expect(repository.findActiveStandaloneChairsByIds).not.toHaveBeenCalled();
  });

  it('syncStandaloneChairUnitPricesInActiveLayout early-exits without layout', async () => {
    repository.findActiveLayout.mockResolvedValue(null);
    await service.syncStandaloneChairUnitPricesInActiveLayout();
    expect(repository.findActiveStandaloneChairsByIds).not.toHaveBeenCalled();
    expect(repository.updateLayoutItems).not.toHaveBeenCalled();
  });

  it('syncStandaloneChairUnitPricesInActiveLayout early-exits when items not array', async () => {
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({ items: { not: 'array' } }),
    );
    await service.syncStandaloneChairUnitPricesInActiveLayout();
    expect(repository.findActiveStandaloneChairsByIds).not.toHaveBeenCalled();
    expect(repository.updateLayoutItems).not.toHaveBeenCalled();
  });

  it('syncStandaloneChairUnitPricesInActiveLayout skips write when unchanged', async () => {
    const chair = makePlacedStandaloneChair({
      venueStandaloneChairId: 'chair-1',
      unitPrice: 30,
    });
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({ items: [chair] }),
    );
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([
      { id: 'chair-1', unitPrice: 30 },
    ]);

    await service.syncStandaloneChairUnitPricesInActiveLayout();
    expect(repository.updateLayoutItems).not.toHaveBeenCalled();
  });

  it('syncStandaloneChairUnitPricesInActiveLayout writes when price changed', async () => {
    const chair = makePlacedStandaloneChair({
      venueStandaloneChairId: 'chair-1',
      unitPrice: 20,
    });
    repository.findActiveLayout.mockResolvedValue(
      makeFloorLayoutRow({ items: [chair] }),
    );
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([
      { id: 'chair-1', unitPrice: 55 },
    ]);
    repository.updateLayoutItems.mockResolvedValue(undefined);

    await service.syncStandaloneChairUnitPricesInActiveLayout();

    expect(repository.updateLayoutItems).toHaveBeenCalledWith(
      'layout-1',
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'standalone_chair',
          venueStandaloneChairId: 'chair-1',
          unitPrice: 55,
        }),
      ]),
    );
  });
});
