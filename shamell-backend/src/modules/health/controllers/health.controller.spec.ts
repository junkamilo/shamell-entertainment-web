import { Test } from '@nestjs/testing';
import {
  makeLivenessResponse,
  makeReadinessResponse,
} from '../__mocks__/health.fixtures';
import { createHealthServiceMock } from '../__mocks__/health.service.mock';
import { HealthService } from '../services/health.service';
import { HealthController } from './health.controller';

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
