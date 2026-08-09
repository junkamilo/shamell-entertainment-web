import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AdminJwtGuard } from '../../../common/auth/admin-jwt.guard';
import { createGalleryServiceMock } from '../../gallery/__mocks__/gallery.service.mock';
import { GalleryService } from '../../gallery/services/gallery.service';
import { makeEventRow } from '../__mocks__/events.fixtures';
import { createEventsServiceMock } from '../__mocks__/events.service.mock';
import { EventsService } from '../services/events.service';
import { EventsController } from './events.controller';

describe('EventsController', () => {
  let controller: EventsController;
  const eventsService = createEventsServiceMock();
  const gallery = createGalleryServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: eventsService },
        { provide: GalleryService, useValue: gallery },
      ],
    })
      .overrideGuard(AdminJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = moduleRef.get(EventsController);
  });

  it('getPublicEvents delegates to service', async () => {
    const payload = [makeEventRow()];
    eventsService.getPublicEvents.mockResolvedValue(payload);
    await expect(controller.getPublicEvents({})).resolves.toEqual(payload);
    expect(eventsService.getPublicEvents).toHaveBeenCalledWith({});
  });

  it('getContactLines delegates', async () => {
    eventsService.getContactLines.mockResolvedValue([]);
    await expect(controller.getContactLines()).resolves.toEqual([]);
  });

  it('getAdminEvents is wired (guard overridden to allow)', async () => {
    eventsService.getAdminEvents.mockResolvedValue([]);
    await expect(controller.getAdminEvents({})).resolves.toEqual([]);
    expect(eventsService.getAdminEvents).toHaveBeenCalled();
  });

  it('updateEvent rejects empty body', () => {
    expect(() => controller.updateEvent('evt-1', {})).toThrow(
      BadRequestException,
    );
  });

  it('addEventCatalogImages requires files', () => {
    expect(() => controller.addEventCatalogImages('evt-1', [])).toThrow(
      BadRequestException,
    );
  });

  it('createEvent delegates', async () => {
    eventsService.createEvent.mockResolvedValue({
      message: 'ok',
      event: makeEventRow(),
    });
    const dto = {
      eventTypeId: 'et-1',
      description: 'd',
      items: [],
    };
    await controller.createEvent(dto);
    expect(eventsService.createEvent).toHaveBeenCalledWith(dto);
  });
});
