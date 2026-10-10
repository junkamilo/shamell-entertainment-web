import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { createAvailabilityRepositoryMock } from '@test-support/modules/availability/mocks/availability.repository.mock';
import { AvailabilityRepository } from '@app/modules/availability/services/availability.repository';
import { AvailabilityService } from '@app/modules/availability/services/availability.service';

export type AvailabilityServiceTestHarness = {
  moduleRef: TestingModule;
  service: AvailabilityService;
  repository: ReturnType<typeof createAvailabilityRepositoryMock>;
  config: { get: jest.Mock };
};

export type AvailabilityServiceTestModuleOptions = {
  bookingTz?: string | undefined;
};

export async function createAvailabilityServiceTestModule(
  options: AvailabilityServiceTestModuleOptions = {},
): Promise<AvailabilityServiceTestHarness> {
  const repository = createAvailabilityRepositoryMock();
  const config = {
    get: jest.fn((key: string) => {
      if (key === 'BOOKING_TZ') return options.bookingTz;
      return undefined;
    }),
  };

  const moduleRef = await Test.createTestingModule({
    providers: [
      AvailabilityService,
      { provide: AvailabilityRepository, useValue: repository },
      { provide: ConfigService, useValue: config },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(AvailabilityService),
    repository,
    config,
  };
}
