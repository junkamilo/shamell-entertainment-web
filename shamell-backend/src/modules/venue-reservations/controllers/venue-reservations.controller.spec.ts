import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createVenueReservationsServiceMock } from '../__mocks__/venue-reservations.service.mock';
import { VenueReservationsService } from '../services/venue-reservations.service';
import { VenueReservationsController } from './venue-reservations.controller';

describe('VenueReservationsController', () => {
  let controller: VenueReservationsController;
  const service = createVenueReservationsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [VenueReservationsController],
      providers: [{ provide: VenueReservationsService, useValue: service }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = moduleRef.get(VenueReservationsController);
  });

  it('getAvailability delegates to service', async () => {
    service.getAvailability.mockResolvedValue({
      reservedLayoutItemIds: [],
    });
    await expect(
      controller.getAvailability('event-1', undefined),
    ).resolves.toEqual({ reservedLayoutItemIds: [] });
    expect(service.getAvailability).toHaveBeenCalledWith({
      upcomingEventId: 'event-1',
      upcomingEventSlug: undefined,
    });
  });

  it('listAdmin delegates to service', async () => {
    service.listAdminReservations.mockResolvedValue({ items: [], total: 0 });
    await expect(controller.listAdmin({ page: 1 })).resolves.toEqual({
      items: [],
      total: 0,
    });
    expect(service.listAdminReservations).toHaveBeenCalledWith({ page: 1 });
  });
});
