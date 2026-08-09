import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  makeFloorLayoutRow,
  makePlacedCatalogTable,
} from '../__mocks__/floor-layout.fixtures';
import { createFloorLayoutRepositoryMock } from '../__mocks__/floor-layout.repository.mock';
import { FloorLayoutRepository } from './floor-layout.repository';
import { FloorLayoutService } from './floor-layout.service';

describe('FloorLayoutService', () => {
  let service: FloorLayoutService;
  const repository = createFloorLayoutRepositoryMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        FloorLayoutService,
        { provide: FloorLayoutRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(FloorLayoutService);
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

  it('getAdminFloorLayout skips publish gate', async () => {
    repository.findActiveLayout.mockResolvedValue(makeFloorLayoutRow());
    repository.findActiveStandaloneChairsByIds.mockResolvedValue([]);
    const result = await service.getAdminFloorLayout();
    expect(result.id).toBe('layout-1');
    expect(repository.findClientSettings).not.toHaveBeenCalled();
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
});
