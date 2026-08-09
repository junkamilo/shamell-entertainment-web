import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import {
  makeMulterFile,
  makeServiceWithType,
} from '../__mocks__/services.fixtures';
import { createServicesServiceMock } from '../__mocks__/services.service.mock';
import { mapPublicService, mapService } from '../utils/services-mapper.util';
import { ServicesService } from '../services/services.service';
import { ServicesController } from './services.controller';

describe('ServicesController', () => {
  let controller: ServicesController;
  const servicesService = createServicesServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [{ provide: ServicesService, useValue: servicesService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(ServicesController);
  });

  it('getPublicServices delegates', async () => {
    const payload = [mapPublicService(makeServiceWithType())];
    servicesService.getPublicServices.mockResolvedValue(payload);
    await expect(controller.getPublicServices()).resolves.toEqual(payload);
  });

  it('getAdminServices delegates', async () => {
    servicesService.getAdminServices.mockResolvedValue([]);
    await expect(controller.getAdminServices()).resolves.toEqual([]);
  });

  it('createService requires image file', () => {
    expect(() =>
      controller.createService(
        {
          serviceTypeId: 'stype-1',
          description: 'x',
          items: [],
        },
        undefined,
      ),
    ).toThrow(BadRequestException);
  });

  it('createService delegates with valid image', async () => {
    const file = makeMulterFile();
    const payload = {
      message: 'ok',
      service: mapService(makeServiceWithType()),
    };
    servicesService.createService.mockResolvedValue(payload);
    await expect(
      controller.createService(
        {
          serviceTypeId: 'stype-1',
          description: 'x',
          items: ['A'],
        },
        file,
      ),
    ).resolves.toEqual(payload);
  });

  it('updateService requires fields or file', () => {
    expect(() => controller.updateService('svc-1', {}, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('deleteService and getPublicCatalogById delegate', async () => {
    servicesService.deleteService.mockResolvedValue({ message: 'deleted' });
    servicesService.getPublicCatalogById.mockResolvedValue({ id: 'svc-1' });
    await expect(controller.deleteService('svc-1')).resolves.toEqual({
      message: 'deleted',
    });
    await expect(controller.getPublicCatalogById('svc-1')).resolves.toEqual({
      id: 'svc-1',
    });
  });
});
