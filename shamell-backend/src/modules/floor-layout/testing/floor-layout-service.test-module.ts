import { Test, type TestingModule } from '@nestjs/testing';
import { createFloorLayoutRepositoryMock } from '../__mocks__/floor-layout.repository.mock';
import { FloorLayoutRepository } from '../services/floor-layout.repository';
import { FloorLayoutService } from '../services/floor-layout.service';

export type FloorLayoutServiceTestHarness = {
  moduleRef: TestingModule;
  service: FloorLayoutService;
  repository: ReturnType<typeof createFloorLayoutRepositoryMock>;
};

export async function createFloorLayoutServiceTestModule(): Promise<FloorLayoutServiceTestHarness> {
  const repository = createFloorLayoutRepositoryMock();

  const moduleRef = await Test.createTestingModule({
    providers: [
      FloorLayoutService,
      { provide: FloorLayoutRepository, useValue: repository },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(FloorLayoutService),
    repository,
  };
}
