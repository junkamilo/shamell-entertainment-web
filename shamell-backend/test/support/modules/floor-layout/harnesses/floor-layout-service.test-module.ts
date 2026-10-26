import { Test, type TestingModule } from '@nestjs/testing';
import { createFloorLayoutRepositoryMock } from '@test-support/modules/floor-layout/mocks/floor-layout.repository.mock';
import { FloorLayoutRepository } from '@app/modules/floor-layout/services/floor-layout.repository';
import { FloorLayoutService } from '@app/modules/floor-layout/services/floor-layout.service';

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
