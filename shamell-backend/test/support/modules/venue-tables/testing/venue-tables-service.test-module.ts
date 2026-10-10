import { Test, type TestingModule } from '@nestjs/testing';
import { FloorLayoutService } from '@app/modules/floor-layout/services/floor-layout.service';
import { createVenueTablesRepositoryMock } from '@test-support/modules/venue-tables/mocks/venue-tables.repository.mock';
import { VenueTablesRepository } from '@app/modules/venue-tables/services/venue-tables.repository';
import { VenueTablesService } from '@app/modules/venue-tables/services/venue-tables.service';

export type VenueTablesServiceTestHarness = {
  moduleRef: TestingModule;
  service: VenueTablesService;
  repository: ReturnType<typeof createVenueTablesRepositoryMock>;
  floorLayout: {
    isTablePlacedOnLayout: jest.Mock;
  };
};

export async function createVenueTablesServiceTestModule(): Promise<VenueTablesServiceTestHarness> {
  const repository = createVenueTablesRepositoryMock();
  const floorLayout = {
    isTablePlacedOnLayout: jest.fn().mockResolvedValue(false),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      VenueTablesService,
      { provide: VenueTablesRepository, useValue: repository },
      { provide: FloorLayoutService, useValue: floorLayout },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(VenueTablesService),
    repository,
    floorLayout,
  };
}
