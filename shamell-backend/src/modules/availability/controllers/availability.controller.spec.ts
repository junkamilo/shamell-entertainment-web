import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createAvailabilityServiceMock } from '../__mocks__/availability.service.mock';
import {
  makeAdminSnapshot,
  makePublicRules,
} from '../__mocks__/availability.fixtures';
import { AvailabilityService } from '../services/availability.service';
import { AvailabilityController } from './availability.controller';

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
