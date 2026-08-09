import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createVenueLayoutSettingsServiceMock } from '../__mocks__/venue-layout-settings.service.mock';
import { VenueLayoutSettingsService } from '../services/venue-layout-settings.service';
import { VenueLayoutSettingsController } from './venue-layout-settings.controller';

describe('VenueLayoutSettingsController', () => {
  let controller: VenueLayoutSettingsController;
  const settings = createVenueLayoutSettingsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [VenueLayoutSettingsController],
      providers: [{ provide: VenueLayoutSettingsService, useValue: settings }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(VenueLayoutSettingsController);
  });

  it('getPublicSettings delegates', async () => {
    settings.getPublicSettings.mockResolvedValue({ clientEnabled: true });
    await expect(controller.getPublicSettings()).resolves.toEqual({
      clientEnabled: true,
    });
  });

  it('patchAdminSettings rejects empty body', () => {
    expect(() => controller.patchAdminSettings({})).toThrow(
      BadRequestException,
    );
  });

  it('upsertAdminPromoMedia requires file', () => {
    expect(() => controller.upsertAdminPromoMedia(undefined)).toThrow(
      BadRequestException,
    );
  });
});
