import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import { createAvailabilityServiceMock } from '@test-support/modules/availability/mocks/availability.service.mock';
import {
  makeAdminSnapshot,
  makePublicRules,
} from '@test-support/modules/availability/fixtures/availability.fixtures';
import { AvailabilityService } from '@app/modules/availability/services/availability.service';
import { AvailabilityController } from '@app/modules/availability/controllers/availability.controller';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  const availabilityService = createAvailabilityServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        { provide: AvailabilityService, useValue: availabilityService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(AvailabilityController);
  });

  it('getPublic delegates', async () => {
    const payload = makePublicRules();
    availabilityService.getPublicRules.mockResolvedValue(payload);
    await expect(controller.getPublic()).resolves.toEqual(payload);
  });

  it('getAdmin delegates', async () => {
    const payload = makeAdminSnapshot();
    availabilityService.getAdminSnapshot.mockResolvedValue(payload);
    await expect(controller.getAdmin()).resolves.toEqual(payload);
  });
});
