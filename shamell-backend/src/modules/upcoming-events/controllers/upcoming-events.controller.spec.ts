import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createAdminClassEnrollmentServiceMock } from '../__mocks__/admin-class-enrollment.service.mock';
import { createAdminFixedEventEnrollmentServiceMock } from '../__mocks__/admin-fixed-event-enrollment.service.mock';
import { makePublicEventStub } from '../__mocks__/upcoming-events.fixtures';
import { createUpcomingEventsServiceMock } from '../__mocks__/upcoming-events.service.mock';
import { AdminClassEnrollmentService } from '../services/admin-class-enrollment.service';
import { AdminFixedEventEnrollmentService } from '../services/admin-fixed-event-enrollment.service';
import { UpcomingEventsService } from '../services/upcoming-events.service';
import { UpcomingEventsController } from './upcoming-events.controller';

describe('UpcomingEventsController', () => {
  let controller: UpcomingEventsController;
  const upcoming = createUpcomingEventsServiceMock();
  const adminClass = createAdminClassEnrollmentServiceMock();
  const adminFixed = createAdminFixedEventEnrollmentServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [UpcomingEventsController],
      providers: [
        { provide: UpcomingEventsService, useValue: upcoming },
        { provide: AdminClassEnrollmentService, useValue: adminClass },
        { provide: AdminFixedEventEnrollmentService, useValue: adminFixed },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(UpcomingEventsController);
  });

  it('getPublicBySlug delegates', async () => {
    const payload = makePublicEventStub();
    upcoming.getPublicBySlug.mockResolvedValue(payload);
    await expect(controller.getPublicBySlug('salsa-night')).resolves.toEqual(
      payload,
    );
    expect(upcoming.getPublicBySlug).toHaveBeenCalledWith('salsa-night');
  });

  it('listAdminBookableClassEvents delegates', async () => {
    adminClass.listAdminBookableClassEvents.mockResolvedValue({ events: [] });
    await expect(controller.listAdminBookableClassEvents()).resolves.toEqual({
      events: [],
    });
  });
});
