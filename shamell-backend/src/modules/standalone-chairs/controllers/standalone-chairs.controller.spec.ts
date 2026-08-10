import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/guards/admin-jwt.guard';
import { createStandaloneChairsServiceMock } from '../__mocks__/standalone-chairs.service.mock';
import { StandaloneChairsService } from '../services/standalone-chairs.service';
import { StandaloneChairsController } from './standalone-chairs.controller';

describe('StandaloneChairsController', () => {
  let controller: StandaloneChairsController;
  const standaloneChairsService = createStandaloneChairsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [StandaloneChairsController],
      providers: [
        {
          provide: StandaloneChairsService,
          useValue: standaloneChairsService,
        },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(StandaloneChairsController);
  });

  it('getPublicStandaloneChairs delegates', async () => {
    const payload = { chairs: [], availableQuantity: 0 };
    standaloneChairsService.getPublicStandaloneChairs.mockResolvedValue(
      payload,
    );
    await expect(controller.getPublicStandaloneChairs()).resolves.toEqual(
      payload,
    );
  });

  it('getAdminStandaloneChairs delegates', async () => {
    standaloneChairsService.getAdminStandaloneChairs.mockResolvedValue({
      chairs: [],
    });
    await expect(controller.getAdminStandaloneChairs()).resolves.toEqual({
      chairs: [],
    });
  });

  it('upsert and patch/delete delegates', async () => {
    standaloneChairsService.upsertAdminStandaloneChairs.mockResolvedValue({});
    standaloneChairsService.patchAdminStandaloneChair.mockResolvedValue({});
    standaloneChairsService.patchAdminStandaloneChairsBulkPrice.mockResolvedValue(
      {},
    );
    standaloneChairsService.deleteAdminStandaloneChair.mockResolvedValue({});
    standaloneChairsService.deleteAllAdminStandaloneChairs.mockResolvedValue(
      {},
    );

    await controller.upsertAdminStandaloneChairs({
      availableQuantity: 1,
      unitPrice: 10,
    });
    await controller.patchAdminStandaloneChair('chair-1', { unitPrice: 12 });
    await controller.patchAdminStandaloneChairsBulkPrice({ unitPrice: 15 });
    await controller.deleteAdminStandaloneChair('chair-1');
    await controller.deleteAllAdminStandaloneChairs();

    expect(
      standaloneChairsService.upsertAdminStandaloneChairs,
    ).toHaveBeenCalled();
    expect(
      standaloneChairsService.deleteAllAdminStandaloneChairs,
    ).toHaveBeenCalled();
  });
});
