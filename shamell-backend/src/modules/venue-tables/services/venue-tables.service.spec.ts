import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VenueTableSize } from '@prisma/client';
import { makeVenueTableConfigRow } from '../__mocks__/venue-tables.fixtures';
import { VenueTableBulkDeleteScope } from '../dto/bulk-delete-venue-table-config.dto';
import { createVenueTablesServiceTestModule } from '../testing/venue-tables-service.test-module';
import * as venueTableNames from '../utils/venue-table-names.util';
import type { VenueTablesService } from './venue-tables.service';

describe('VenueTablesService', () => {
  let service: VenueTablesService;
  let repository: Awaited<
    ReturnType<typeof createVenueTablesServiceTestModule>
  >['repository'];
  let floorLayout: Awaited<
    ReturnType<typeof createVenueTablesServiceTestModule>
  >['floorLayout'];

  beforeEach(async () => {
    const harness = await createVenueTablesServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    floorLayout = harness.floorLayout;
  });

  it('getPublicVenueTables maps active rows', async () => {
    repository.findActiveTables.mockResolvedValue([
      makeVenueTableConfigRow({ id: 'pub-1' }),
    ]);
    const result = await service.getPublicVenueTables();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pub-1');
    expect(result[0].displayLabel).toBe('Large');
    expect(result[0].bundlePrice).toBe(150);
  });

  it('getAdminVenueTables maps all rows', async () => {
    repository.findAllTables.mockResolvedValue([
      makeVenueTableConfigRow({ id: 'admin-1', isActive: false }),
    ]);
    const result = await service.getAdminVenueTables();
    expect(result[0].id).toBe('admin-1');
    expect(result[0].isActive).toBe(false);
  });

  it('getAdminVenueTableById returns mapped row', async () => {
    repository.findById.mockResolvedValue(
      makeVenueTableConfigRow({ id: 'table-1' }),
    );
    const result = await service.getAdminVenueTableById('table-1');
    expect(result.id).toBe('table-1');
    expect(result.tableName).toBe('LARGE-abcd1234');
  });

  it('getAdminVenueTableById throws NotFound when missing', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(
      service.getAdminVenueTableById('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createAdminVenueTable creates with custom tableName', async () => {
    const created = makeVenueTableConfigRow({
      id: 'new-1',
      tableName: 'VIP Booth',
      includedChairs: 6,
      bundlePrice: 200,
    });
    repository.create.mockResolvedValue(created);

    const result = await service.createAdminVenueTable({
      size: VenueTableSize.LARGE,
      includedChairs: 6,
      bundlePrice: 200,
      tableName: 'VIP Booth',
    });

    expect(result.tableName).toBe('VIP Booth');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tableName: 'VIP Booth',
        size: VenueTableSize.LARGE,
        includedChairs: 6,
        bundlePrice: 200,
        isActive: true,
        sortOrder: 0,
      }),
    );
  });

  it('createAdminVenueTable builds technical name when tableName omitted', async () => {
    repository.create.mockImplementation(
      (data: { id: string; tableName: string }) =>
        Promise.resolve(
          makeVenueTableConfigRow({
            id: data.id,
            tableName: data.tableName,
          }),
        ),
    );

    const result = await service.createAdminVenueTable({
      size: VenueTableSize.MEDIUM,
      includedChairs: 4,
      bundlePrice: 120,
    });

    expect(result.tableName).toMatch(/^MEDIUM-[a-f0-9]{8}$/);
    expect(repository.create).toHaveBeenCalled();
  });

  it('createAdminVenueTable rejects invalid includedChairs', async () => {
    await expect(
      service.createAdminVenueTable({
        size: VenueTableSize.LARGE,
        includedChairs: 99,
        bundlePrice: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('bulkCreateAdminVenueTables creates quantity of tables', async () => {
    repository.findAllTableNames.mockResolvedValue([]);
    repository.maxSortOrder.mockResolvedValue(2);
    const rows = [
      makeVenueTableConfigRow({ id: 'b1', tableName: 'LARGE-11111111' }),
      makeVenueTableConfigRow({ id: 'b2', tableName: 'LARGE-22222222' }),
    ];
    repository.createManyFromEntries.mockResolvedValue(rows);

    const result = await service.bulkCreateAdminVenueTables({
      quantity: 2,
      size: VenueTableSize.LARGE,
      includedChairs: 6,
      bundlePrice: 180,
    });

    expect(result.count).toBe(2);
    expect(result.created).toHaveLength(2);
    expect(repository.createManyFromEntries).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        size: VenueTableSize.LARGE,
        includedChairs: 6,
        bundlePrice: 180,
        baseSortOrder: 3,
      }),
    );
  });

  it('bulkCreateAdminVenueTables rejects name conflict', async () => {
    const conflictName = 'LARGE-deadbeef';
    jest
      .spyOn(venueTableNames, 'generateTechnicalTableNameEntries')
      .mockReturnValue([{ id: 'id-1', tableName: conflictName }]);

    repository.findAllTableNames.mockResolvedValue([
      { tableName: conflictName },
    ]);

    await expect(
      service.bulkCreateAdminVenueTables({
        quantity: 1,
        size: VenueTableSize.LARGE,
        includedChairs: 6,
        bundlePrice: 100,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createManyFromEntries).not.toHaveBeenCalled();
  });

  it('updateAdminVenueTable renames when size changes and clamps chairs', async () => {
    repository.findById.mockResolvedValue(
      makeVenueTableConfigRow({
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        size: VenueTableSize.LARGE,
        includedChairs: 8,
        tableName: 'LARGE-aaaabbbb',
      }),
    );
    repository.update.mockImplementation((_id: string, data: object) =>
      Promise.resolve(
        makeVenueTableConfigRow({
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          size: VenueTableSize.SMALL,
          includedChairs: 4,
          ...data,
        }),
      ),
    );

    const result = await service.updateAdminVenueTable(
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      { size: VenueTableSize.SMALL },
    );

    expect(repository.update).toHaveBeenCalledWith(
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      expect.objectContaining({
        size: VenueTableSize.SMALL,
        includedChairs: 4,
        tableName: 'SMALL-aaaaaaaa',
      }),
    );
    expect(result.size).toBe(VenueTableSize.SMALL);
  });

  it('updateAdminVenueTable updates bundlePrice without rename', async () => {
    repository.findById.mockResolvedValue(makeVenueTableConfigRow());
    repository.update.mockResolvedValue(
      makeVenueTableConfigRow({ bundlePrice: 250 }),
    );

    const result = await service.updateAdminVenueTable('table-1', {
      bundlePrice: 250,
    });

    expect(repository.update).toHaveBeenCalledWith(
      'table-1',
      expect.objectContaining({
        bundlePrice: 250,
        includedChairs: 6,
      }),
    );
    expect(result.bundlePrice).toBe(250);
  });

  it('deleteAdminVenueTable blocks when table is on floor plan', async () => {
    repository.findById.mockResolvedValue(makeVenueTableConfigRow());
    floorLayout.isTablePlacedOnLayout.mockResolvedValue(true);
    await expect(
      service.deleteAdminVenueTable('table-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('deleteAdminVenueTable soft-deactivates when not on floor', async () => {
    repository.findById.mockResolvedValue(makeVenueTableConfigRow());
    floorLayout.isTablePlacedOnLayout.mockResolvedValue(false);
    repository.update.mockResolvedValue(
      makeVenueTableConfigRow({ isActive: false }),
    );

    const result = await service.deleteAdminVenueTable('table-1');
    expect(result.isActive).toBe(false);
    expect(repository.update).toHaveBeenCalledWith('table-1', {
      isActive: false,
    });
  });

  it('bulkUpdateAdminVenueTablesBundlePrice requires SIZE scope', async () => {
    await expect(
      service.bulkUpdateAdminVenueTablesBundlePrice({
        scope: VenueTableBulkDeleteScope.ALL,
        bundlePrice: 99,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateManyActiveBySize).not.toHaveBeenCalled();
  });

  it('bulkUpdateAdminVenueTablesBundlePrice updates by size', async () => {
    repository.updateManyActiveBySize.mockResolvedValue({ count: 3 });
    const result = await service.bulkUpdateAdminVenueTablesBundlePrice({
      scope: VenueTableBulkDeleteScope.SIZE,
      size: VenueTableSize.MEDIUM,
      bundlePrice: 175,
    });
    expect(result).toEqual({
      scope: VenueTableBulkDeleteScope.SIZE,
      size: VenueTableSize.MEDIUM,
      updatedCount: 3,
    });
    expect(repository.updateManyActiveBySize).toHaveBeenCalledWith(
      VenueTableSize.MEDIUM,
      175,
    );
  });

  it('bulkDeleteAdminVenueTables requires size when scope is SIZE', async () => {
    await expect(
      service.bulkDeleteAdminVenueTables({
        scope: VenueTableBulkDeleteScope.SIZE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.bulkDeleteActiveTables).not.toHaveBeenCalled();
  });

  it('bulkDeleteAdminVenueTables deletes by ALL scope', async () => {
    repository.bulkDeleteActiveTables.mockResolvedValue({
      size: null,
      deletedCount: 5,
    });
    const result = await service.bulkDeleteAdminVenueTables({
      scope: VenueTableBulkDeleteScope.ALL,
    });
    expect(result).toEqual({
      scope: VenueTableBulkDeleteScope.ALL,
      size: null,
      deletedCount: 5,
    });
    expect(repository.bulkDeleteActiveTables).toHaveBeenCalledWith({
      size: undefined,
    });
  });

  it('bulkDeleteAdminVenueTables deletes by SIZE scope', async () => {
    repository.bulkDeleteActiveTables.mockResolvedValue({
      size: VenueTableSize.SMALL,
      deletedCount: 2,
    });
    const result = await service.bulkDeleteAdminVenueTables({
      scope: VenueTableBulkDeleteScope.SIZE,
      size: VenueTableSize.SMALL,
    });
    expect(result.deletedCount).toBe(2);
    expect(repository.bulkDeleteActiveTables).toHaveBeenCalledWith({
      size: VenueTableSize.SMALL,
    });
  });
});
