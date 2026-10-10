import { Test } from '@nestjs/testing';
import {
  makeLivenessResponse,
  makeReadinessResponse,
} from '@test-support/modules/health/fixtures/health.fixtures';
import { createHealthServiceMock } from '@test-support/modules/health/mocks/health.service.mock';
import { HealthService } from '@app/modules/health/services/health.service';
import { HealthController } from '@app/modules/health/controllers/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const healthService = createHealthServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: healthService }],
    }).compile();
    controller = moduleRef.get(HealthController);
  });

  it('liveness delegates to service', () => {
    const payload = makeLivenessResponse();
    healthService.liveness.mockReturnValue(payload);
    expect(controller.liveness()).toEqual(payload);
    expect(healthService.liveness).toHaveBeenCalled();
  });

  it('readiness delegates to service', async () => {
    const payload = makeReadinessResponse();
    healthService.readiness.mockResolvedValue(payload);
    await expect(controller.readiness()).resolves.toEqual(payload);
    expect(healthService.readiness).toHaveBeenCalled();
  });
});
