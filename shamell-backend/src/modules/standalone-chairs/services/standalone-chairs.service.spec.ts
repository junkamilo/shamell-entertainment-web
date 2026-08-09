import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import {
  makeChairConfig,
  makeChairRow,
  makeLayoutChairItem,
  makePaidReservation,
} from '../__mocks__/standalone-chairs.fixtures';
import { createStandaloneChairsRepositoryMock } from '../__mocks__/standalone-chairs.repository.mock';
import { StandaloneChairsRepository } from './standalone-chairs.repository';
import { StandaloneChairsService } from './standalone-chairs.service';

describe('StandaloneChairsService', () => {
  let service: StandaloneChairsService;
  const repository = createStandaloneChairsRepositoryMock();
  const floorLayout = {
    syncStandaloneChairUnitPricesInActiveLayout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        StandaloneChairsService,
        { provide: StandaloneChairsRepository, useValue: repository },
        { provide: FloorLayoutService, useValue: floorLayout },
      ],
    }).compile();
    service = moduleRef.get(StandaloneChairsService);
  });

  it('getPublicStandaloneChairs returns catalog', async () => {
    repository.findActiveConfig.mockResolvedValue(makeChairConfig());
    repository.countActiveChairs.mockResolvedValue(1);
    repository.findActiveChairsPublic.mockResolvedValue([makeChairRow()]);
    const result = await service.getPublicStandaloneChairs();
    expect(result.availableQuantity).toBe(1);
    expect(result.chairs).toHaveLength(1);
    expect(result.unitPrice).toBe(25);
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

  it('patchAdminStandaloneChair updates price when free', async () => {
    repository.findActiveChairById.mockResolvedValue(makeChairRow());
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
    repository.updateChairUnitPrice.mockResolvedValue(undefined);
    repository.findActiveConfig.mockResolvedValue(makeChairConfig());
    repository.countActiveChairs.mockResolvedValue(1);
    repository.findActiveChairs.mockResolvedValue([makeChairRow()]);
    floorLayout.syncStandaloneChairUnitPricesInActiveLayout.mockResolvedValue(
      undefined,
    );

    const result = await service.patchAdminStandaloneChair('chair-1', {
      unitPrice: 40,
    });
    expect(repository.updateChairUnitPrice).toHaveBeenCalledWith('chair-1', 40);
    expect(result.chairs).toHaveLength(1);
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

  it('upsertAdminStandaloneChairs creates chairs when increasing qty', async () => {
    repository.getPlacedStandaloneChairIds.mockResolvedValue(new Set());
    repository.findActiveChairsDesc.mockResolvedValue([makeChairRow()]);
    repository.maxSortOrder.mockResolvedValue(0);
    repository.createChairsFromEntries.mockResolvedValue(undefined);
    repository.findActiveConfig.mockResolvedValue(makeChairConfig());
    repository.updateConfigQuantity.mockResolvedValue(undefined);
    repository.countActiveChairs.mockResolvedValue(2);
    repository.findActiveChairs.mockResolvedValue([
      makeChairRow(),
      makeChairRow({ id: 'chair-2', sortOrder: 1 }),
    ]);
    repository.getActiveLayoutItems.mockResolvedValue([]);
    repository.findPaidStandaloneChairReservations.mockResolvedValue([]);

    const result = await service.upsertAdminStandaloneChairs({
      availableQuantity: 2,
      unitPrice: 25,
    });
    expect(repository.createChairsFromEntries).toHaveBeenCalled();
    expect(result.availableQuantity).toBe(2);
  });
});
