import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '@app/common/auth/guards/admin-jwt.guard';
import { createVenueTablesServiceMock } from '@test-support/modules/venue-tables/mocks/venue-tables.service.mock';
import { VenueTablesService } from '@app/modules/venue-tables/services/venue-tables.service';
import { VenueTablesController } from '@app/modules/venue-tables/controllers/venue-tables.controller';

describe('VenueTablesController', () => {
  let controller: VenueTablesController;
  const service = createVenueTablesServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [VenueTablesController],
      providers: [{ provide: VenueTablesService, useValue: service }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(VenueTablesController);
  });

  it('getPublicVenueTables delegates', async () => {
    service.getPublicVenueTables.mockResolvedValue([]);
    await expect(controller.getPublicVenueTables()).resolves.toEqual([]);
    expect(service.getPublicVenueTables).toHaveBeenCalled();
  });

  it('getAdminVenueTables delegates', async () => {
    service.getAdminVenueTables.mockResolvedValue([{ id: 't1' }]);
    await expect(controller.getAdminVenueTables()).resolves.toEqual([
      { id: 't1' },
    ]);
  });
});
