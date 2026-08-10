import { Test, type TestingModule } from '@nestjs/testing';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { createVenueTablesRepositoryMock } from '../__mocks__/venue-tables.repository.mock';
import { VenueTablesRepository } from '../services/venue-tables.repository';
import { VenueTablesService } from '../services/venue-tables.service';

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
