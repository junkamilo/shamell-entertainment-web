import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import {
  makeFloorLayoutMapped,
  makeFloorLayoutPalette,
} from '@test-support/modules/floor-layout/fixtures/floor-layout.fixtures';
import { createFloorLayoutServiceMock } from '@test-support/modules/floor-layout/mocks/floor-layout.service.mock';
import { FloorLayoutService } from '@app/modules/floor-layout/services/floor-layout.service';
import { FloorLayoutController } from '@app/modules/floor-layout/controllers/floor-layout.controller';

describe('FloorLayoutController', () => {
  let controller: FloorLayoutController;
  const floorLayoutService = createFloorLayoutServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [FloorLayoutController],
      providers: [
        { provide: FloorLayoutService, useValue: floorLayoutService },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(FloorLayoutController);
  });

  it('getPublicFloorLayout delegates to service', async () => {
    const payload = makeFloorLayoutMapped();
    floorLayoutService.getPublicFloorLayout.mockResolvedValue(payload);
    await expect(controller.getPublicFloorLayout()).resolves.toEqual(payload);
  });

  it('getAdminFloorLayout delegates to service', async () => {
    floorLayoutService.getAdminFloorLayout.mockResolvedValue(
      makeFloorLayoutMapped(),
    );
    await expect(controller.getAdminFloorLayout()).resolves.toMatchObject({
      id: 'layout-1',
    });
  });

  it('getAdminPalette delegates to service', async () => {
    const palette = makeFloorLayoutPalette();
    floorLayoutService.getAdminPalette.mockResolvedValue(palette);
    await expect(controller.getAdminPalette()).resolves.toEqual(palette);
  });

  it('upsertAdminFloorLayout passes dto', async () => {
    const dto = { items: [] };
    floorLayoutService.upsertAdminFloorLayout.mockResolvedValue(
      makeFloorLayoutMapped(),
    );
    await controller.upsertAdminFloorLayout(dto);
    expect(floorLayoutService.upsertAdminFloorLayout).toHaveBeenCalledWith(dto);
  });
});
