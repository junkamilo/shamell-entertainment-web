import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createBookingsServiceMock } from '../__mocks__/bookings.service.mock';
import { makeOccupiedPayload } from '../__mocks__/bookings.fixtures';
import { BookingsService } from '../services/bookings.service';
import { BookingsController } from './bookings.controller';

describe('BookingsController', () => {
  let controller: BookingsController;
  const bookingsService = createBookingsServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(BookingsController);
  });

  it('getOccupiedPublic delegates', async () => {
    const payload = makeOccupiedPayload();
    bookingsService.getPublicOccupiedByDate.mockResolvedValue(payload);
    await expect(controller.getOccupiedPublic('2026-07-15')).resolves.toEqual(
      payload,
    );
    expect(bookingsService.getPublicOccupiedByDate).toHaveBeenCalledWith(
      '2026-07-15',
    );
  });

  it('findOneAdmin delegates', async () => {
    bookingsService.findOneAdmin.mockResolvedValue({ id: 'b-1' });
    await expect(controller.findOneAdmin('b-1')).resolves.toEqual({
      id: 'b-1',
    });
  });
});
