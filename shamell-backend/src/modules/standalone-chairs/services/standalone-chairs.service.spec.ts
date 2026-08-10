import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  makeChairConfig,
  makeChairRow,
  makeLayoutChairItem,
  makePaidReservation,
} from '../__mocks__/standalone-chairs.fixtures';
import { createStandaloneChairsServiceTestModule } from '../testing/standalone-chairs-service.test-module';
import type { StandaloneChairsService } from './standalone-chairs.service';

describe('StandaloneChairsService', () => {
  let service: StandaloneChairsService;
  let repository: Awaited<
    ReturnType<typeof createStandaloneChairsServiceTestModule>
  >['repository'];
  let floorLayout: Awaited<
    ReturnType<typeof createStandaloneChairsServiceTestModule>
  >['floorLayout'];

  beforeEach(async () => {
    const harness = await createStandaloneChairsServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    floorLayout = harness.floorLayout;
  });

  function stubAdminListResponse(
    chairs = [makeChairRow()],
    config = makeChairConfig({ availableQuantity: chairs.length }),
  ) {
    repository.findActiveConfig.mockResolvedValue(config);
    repository.countActiveChairs.mockResolvedValue(chairs.length);
    repository.findActiveChairs.mockResolvedValue(chairs);
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
  }

  it('getPublicStandaloneChairs returns catalog', async () => {
    repository.findActiveConfig.mockResolvedValue(makeChairConfig());
    repository.countActiveChairs.mockResolvedValue(1);
    repository.findActiveChairsPublic.mockResolvedValue([makeChairRow()]);
    const result = await service.getPublicStandaloneChairs();
    expect(result.availableQuantity).toBe(1);
    expect(result.chairs).toHaveLength(1);
    expect(result.unitPrice).toBe(25);
  });

  it('getPublicStandaloneChairs materializes chairs from legacy config', async () => {
    const config = makeChairConfig({ availableQuantity: 3 });
    repository.findActiveConfig.mockResolvedValue(config);
    repository.countActiveChairs
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(3);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.findActiveChairsPublic.mockResolvedValue([
      makeChairRow(),
      makeChairRow({ id: 'chair-2', sortOrder: 1 }),
      makeChairRow({ id: 'chair-3', sortOrder: 2 }),
    ]);

    const result = await service.getPublicStandaloneChairs();
    expect(repository.createChairsFromEntries).toHaveBeenCalledWith(
      expect.any(Array),
      25,
      0,
    );
    expect(result.availableQuantity).toBe(3);
    expect(result.chairs).toHaveLength(3);
  });

  it('getAdminStandaloneChairs materializes legacy and reports reservedCount', async () => {
    const config = makeChairConfig({ availableQuantity: 2 });
    repository.findActiveConfig.mockResolvedValue(config);
    repository.countActiveChairs
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.findActiveChairs.mockResolvedValue([
      makeChairRow(),
      makeChairRow({ id: 'chair-2', sortOrder: 1 }),
    ]);
    repository.getActiveLayoutItems.mockResolvedValue([makeLayoutChairItem()]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation(),
    ]);

    const result = await service.getAdminStandaloneChairs();
    expect(repository.createChairsFromEntries).toHaveBeenCalled();
    expect(result.reservedCount).toBe(1);
    expect(result.totalCount).toBe(2);
    expect(result.chairs[0]?.isReserved).toBe(true);
  });

  it('upsertAdminStandaloneChairs creates chairs when increasing qty', async () => {
    repository.getPlacedStandaloneChairIds.mockResolvedValue(new Set());
    repository.findActiveChairsDesc.mockResolvedValue([makeChairRow()]);
    repository.maxSortOrder.mockResolvedValue(0);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.findActiveConfig.mockResolvedValue(makeChairConfig());
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminListResponse([
      makeChairRow(),
      makeChairRow({ id: 'chair-2', sortOrder: 1 }),
    ]);

    const result = await service.upsertAdminStandaloneChairs({
      availableQuantity: 2,
      unitPrice: 25,
    });
    expect(repository.createChairsFromEntries).toHaveBeenCalled();
    expect(repository.updateConfigQuantity).toHaveBeenCalledWith(
      'config-1',
      2,
      25,
    );
    expect(result.availableQuantity).toBe(2);
  });

  it('upsertAdminStandaloneChairs blocks reduce when chairs are placed', async () => {
    repository.getPlacedStandaloneChairIds.mockResolvedValue(
      new Set(['chair-1', 'chair-2']),
    );
    repository.findActiveChairsDesc.mockResolvedValue([
      makeChairRow({ id: 'chair-2', sortOrder: 1 }),
      makeChairRow({ id: 'chair-1', sortOrder: 0 }),
    ]);

    await expect(
      service.upsertAdminStandaloneChairs({
        availableQuantity: 0,
        unitPrice: 25,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.deleteChairsByIds).not.toHaveBeenCalled();
  });

  it('upsertAdminStandaloneChairs reduces unplaced chairs', async () => {
    repository.getPlacedStandaloneChairIds.mockResolvedValue(
      new Set(['chair-1']),
    );
    repository.findActiveChairsDesc.mockResolvedValue([
      makeChairRow({ id: 'chair-2', sortOrder: 1 }),
      makeChairRow({ id: 'chair-1', sortOrder: 0 }),
    ]);
    repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
      undefined,
    );
    repository.deleteChairsByIds.mockResolvedValue(undefined);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 2 }),
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminListResponse([makeChairRow()]);

    const result = await service.upsertAdminStandaloneChairs({
      availableQuantity: 1,
      unitPrice: 30,
    });
    expect(repository.deleteChairsByIds).toHaveBeenCalledWith(['chair-2']);
    expect(repository.updateConfigQuantity).toHaveBeenCalledWith(
      'config-1',
      1,
      undefined,
    );
    expect(result.availableQuantity).toBe(1);
  });

  it('upsertAdminStandaloneChairs creates config when missing', async () => {
    repository.getPlacedStandaloneChairIds.mockResolvedValue(new Set());
    repository.findActiveChairsDesc.mockResolvedValue([]);
    repository.maxSortOrder.mockResolvedValue(-1);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.createConfig.mockResolvedValue(undefined);
    repository.findActiveConfig
      .mockResolvedValueOnce(null)
      .mockResolvedValue(makeChairConfig());
    repository.countActiveChairs.mockResolvedValue(1);
    repository.findActiveChairs.mockResolvedValue([makeChairRow()]);
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);

    await service.upsertAdminStandaloneChairs({
      availableQuantity: 1,
      unitPrice: 18,
    });
    expect(repository.createConfig).toHaveBeenCalledWith(1, 18);
  });

  it('patchAdminStandaloneChair throws NotFound', async () => {
    repository.findActiveChairById.mockResolvedValue(null);
    await expect(
      service.patchAdminStandaloneChair('missing', { unitPrice: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('patchAdminStandaloneChair blocks reserved chairs', async () => {
    repository.findActiveChairById.mockResolvedValue(makeChairRow());
    repository.getActiveLayoutItems.mockResolvedValue([makeLayoutChairItem()]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation(),
    ]);
    await expect(
      service.patchAdminStandaloneChair('chair-1', { unitPrice: 40 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('patchAdminStandaloneChair updates price and syncs layout', async () => {
    repository.findActiveChairById.mockResolvedValue(makeChairRow());
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.updateChairUnitPrice.mockResolvedValue(undefined);
    stubAdminListResponse();

    const result = await service.patchAdminStandaloneChair('chair-1', {
      unitPrice: 40,
    });
    expect(repository.updateChairUnitPrice).toHaveBeenCalledWith('chair-1', 40);
    expect(
      floorLayout.syncStandaloneChairUnitPricesInActiveLayout,
    ).toHaveBeenCalled();
    expect(result.chairs).toHaveLength(1);
  });

  it('patchAdminStandaloneChairsBulkPrice blocks when any reserved', async () => {
    repository.getActiveLayoutItems.mockResolvedValue([makeLayoutChairItem()]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation(),
    ]);
    repository.findActiveChairIds.mockResolvedValue([
      { id: 'chair-1' },
      { id: 'chair-2' },
    ]);

    await expect(
      service.patchAdminStandaloneChairsBulkPrice({ unitPrice: 50 }),
    ).rejects.toThrow(BadRequestException);
    expect(repository.updateAllActiveUnitPrices).not.toHaveBeenCalled();
  });

  it('patchAdminStandaloneChairsBulkPrice updates all and syncs layout', async () => {
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.findActiveChairIds.mockResolvedValue([
      { id: 'chair-1' },
      { id: 'chair-2' },
    ]);
    repository.updateAllActiveUnitPrices.mockResolvedValue(undefined);
    stubAdminListResponse(
      [
        makeChairRow({ unitPrice: 50 }),
        makeChairRow({ id: 'chair-2', unitPrice: 50, sortOrder: 1 }),
      ],
      makeChairConfig({ availableQuantity: 2, unitPrice: 50 }),
    );

    const result = await service.patchAdminStandaloneChairsBulkPrice({
      unitPrice: 50,
    });
    expect(repository.updateAllActiveUnitPrices).toHaveBeenCalledWith(50);
    expect(
      floorLayout.syncStandaloneChairUnitPricesInActiveLayout,
    ).toHaveBeenCalled();
    expect(result.unitPrice).toBe(50);
  });

  it('deleteAdminStandaloneChair throws NotFound', async () => {
    repository.findActiveChairById.mockResolvedValue(null);
    await expect(service.deleteAdminStandaloneChair('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deleteAdminStandaloneChair blocks reserved', async () => {
    repository.findActiveChairById.mockResolvedValue(makeChairRow());
    repository.getActiveLayoutItems.mockResolvedValue([makeLayoutChairItem()]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation(),
    ]);
    await expect(service.deleteAdminStandaloneChair('chair-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('deleteAdminStandaloneChair cleans layout and syncs config qty', async () => {
    repository.findActiveChairById.mockResolvedValue(makeChairRow());
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
      undefined,
    );
    repository.deleteChair.mockResolvedValue(undefined);
    repository.countActiveChairs.mockResolvedValue(0);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 1 }),
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminListResponse([], makeChairConfig({ availableQuantity: 0 }));

    const result = await service.deleteAdminStandaloneChair('chair-1');
    expect(
      repository.cleanupDeletedChairReferencesFromLayout,
    ).toHaveBeenCalledWith(['chair-1']);
    expect(repository.deleteChair).toHaveBeenCalledWith('chair-1');
    expect(repository.updateConfigQuantity).toHaveBeenCalledWith('config-1', 0);
    expect(result.availableQuantity).toBe(0);
  });

  it('deleteAllAdminStandaloneChairs blocks when reserved', async () => {
    repository.getActiveLayoutItems.mockResolvedValue([makeLayoutChairItem()]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([
      makePaidReservation(),
    ]);
    repository.findActiveChairIds.mockResolvedValue([{ id: 'chair-1' }]);

    await expect(service.deleteAllAdminStandaloneChairs()).rejects.toThrow(
      BadRequestException,
    );
    expect(repository.deleteChairsByIds).not.toHaveBeenCalled();
  });

  it('deleteAllAdminStandaloneChairs cleans layout and syncs config', async () => {
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.findActiveChairIds.mockResolvedValue([
      { id: 'chair-1' },
      { id: 'chair-2' },
    ]);
    repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
      undefined,
    );
    repository.deleteChairsByIds.mockResolvedValue(undefined);
    repository.countActiveChairs.mockResolvedValue(0);
    repository.findActiveConfig.mockResolvedValue(
      makeChairConfig({ availableQuantity: 2 }),
    );
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    stubAdminListResponse([], makeChairConfig({ availableQuantity: 0 }));

    const result = await service.deleteAllAdminStandaloneChairs();
    expect(
      repository.cleanupDeletedChairReferencesFromLayout,
    ).toHaveBeenCalledWith(['chair-1', 'chair-2']);
    expect(repository.deleteChairsByIds).toHaveBeenCalledWith([
      'chair-1',
      'chair-2',
    ]);
    expect(repository.updateConfigQuantity).toHaveBeenCalledWith('config-1', 0);
    expect(result.totalCount).toBe(0);
  });
});
