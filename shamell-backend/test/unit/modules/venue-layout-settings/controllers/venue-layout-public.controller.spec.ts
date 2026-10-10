import { Test } from '@nestjs/testing';
import { FloorLayoutService } from '@app/modules/floor-layout/services/floor-layout.service';
import { createVenueLayoutSettingsServiceMock } from '@test-support/modules/venue-layout-settings/mocks/venue-layout-settings.service.mock';
import { VenueLayoutSettingsService } from '@app/modules/venue-layout-settings/services/venue-layout-settings.service';
import { VenueLayoutPublicController } from '@app/modules/venue-layout-settings/controllers/venue-layout-public.controller';

describe('VenueLayoutPublicController', () => {
  let controller: VenueLayoutPublicController;
  const settings = createVenueLayoutSettingsServiceMock();
  const floorLayout = {
    getPublicFloorLayoutForClient: jest.fn().mockResolvedValue({ items: [] }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [VenueLayoutPublicController],
      providers: [
        { provide: VenueLayoutSettingsService, useValue: settings },
        { provide: FloorLayoutService, useValue: floorLayout },
      ],
    }).compile();
    controller = moduleRef.get(VenueLayoutPublicController);
  });

  it('getPublicBundle omits layout when disabled', async () => {
    settings.getPublicSettings.mockResolvedValue({ clientEnabled: false });
    await expect(controller.getPublicBundle()).resolves.toEqual({
      settings: { clientEnabled: false },
      layout: null,
    });
    expect(floorLayout.getPublicFloorLayoutForClient).not.toHaveBeenCalled();
  });

  it('getPublicBundle includes layout when enabled', async () => {
    settings.getPublicSettings.mockResolvedValue({ clientEnabled: true });
    await expect(controller.getPublicBundle()).resolves.toEqual({
      settings: { clientEnabled: true },
      layout: { items: [] },
    });
  });
});
