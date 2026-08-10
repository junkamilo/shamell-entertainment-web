import { Test, type TestingModule } from '@nestjs/testing';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { createStandaloneChairsRepositoryMock } from '../__mocks__/standalone-chairs.repository.mock';
import { StandaloneChairsRepository } from '../services/standalone-chairs.repository';
import { StandaloneChairsService } from '../services/standalone-chairs.service';

export type StandaloneChairsFloorLayoutMock = {
  syncStandaloneChairUnitPricesInActiveLayout: jest.Mock;
};

export type StandaloneChairsServiceTestHarness = {
  moduleRef: TestingModule;
  service: StandaloneChairsService;
  repository: ReturnType<typeof createStandaloneChairsRepositoryMock>;
  floorLayout: StandaloneChairsFloorLayoutMock;
};

export async function createStandaloneChairsServiceTestModule(): Promise<StandaloneChairsServiceTestHarness> {
  const repository = createStandaloneChairsRepositoryMock();
  const floorLayout: StandaloneChairsFloorLayoutMock = {
    syncStandaloneChairUnitPricesInActiveLayout: jest
      .fn()
      .mockResolvedValue(undefined),
  };

  repository.getPlacedStandaloneChairIds.mockResolvedValue(new Set());
  repository.getActiveLayoutItems.mockResolvedValue([]);
  repository.findPaidStandaloneChairReservations.mockResolvedValue([]);
  repository.countActiveChairs.mockResolvedValue(0);
  repository.findActiveChairs.mockResolvedValue([]);
  repository.findActiveChairsDesc.mockResolvedValue([]);
  repository.findActiveChairsPublic.mockResolvedValue([]);
  repository.findActiveChairIds.mockResolvedValue([]);
  repository.findActiveConfig.mockResolvedValue(null);
  repository.maxSortOrder.mockResolvedValue(0);
  repository.createChairsFromEntries.mockResolvedValue(undefined);
  repository.updateChairUnitPrice.mockResolvedValue(undefined);
  repository.updateAllActiveUnitPrices.mockResolvedValue(undefined);
  repository.deleteChair.mockResolvedValue(undefined);
  repository.deleteChairsByIds.mockResolvedValue(undefined);
  repository.updateConfigQuantity.mockResolvedValue(undefined);
  repository.createConfig.mockResolvedValue(undefined);
  repository.cleanupDeletedChairReferencesFromLayout.mockResolvedValue(
    undefined,
  );

  const moduleRef = await Test.createTestingModule({
    providers: [
      StandaloneChairsService,
      { provide: StandaloneChairsRepository, useValue: repository },
      { provide: FloorLayoutService, useValue: floorLayout },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(StandaloneChairsService),
    repository,
    floorLayout,
  };
}
