import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import {
  makeFloorLayoutMapped,
  makeFloorLayoutPalette,
} from '../__mocks__/floor-layout.fixtures';
import { createFloorLayoutServiceMock } from '../__mocks__/floor-layout.service.mock';
import { FloorLayoutService } from '../services/floor-layout.service';
import { FloorLayoutController } from './floor-layout.controller';

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
