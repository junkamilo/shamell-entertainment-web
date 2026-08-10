import { Test, type TestingModule } from '@nestjs/testing';
import { createGalleryServiceMock } from '../../gallery/__mocks__/gallery.service.mock';
import { GalleryService } from '../../gallery/services/gallery.service';
import { createEventsRepositoryMock } from '../__mocks__/events.repository.mock';
import { EventsRepository } from '../services/events.repository';
import { EventsService } from '../services/events.service';

export type EventsServiceTestHarness = {
  moduleRef: TestingModule;
  service: EventsService;
  repository: ReturnType<typeof createEventsRepositoryMock>;
  gallery: ReturnType<typeof createGalleryServiceMock>;
};

export async function createEventsServiceTestModule(): Promise<EventsServiceTestHarness> {
  const repository = createEventsRepositoryMock();
  const gallery = createGalleryServiceMock();

  repository.asPrisma.mockReturnValue({});
  repository.groupActiveClassSessionsByEvent.mockResolvedValue([]);
  repository.findHubVenueConfigs.mockResolvedValue([]);
  gallery.deletePhoto.mockResolvedValue(undefined);

  const moduleRef = await Test.createTestingModule({
    providers: [
      EventsService,
      { provide: EventsRepository, useValue: repository },
      { provide: GalleryService, useValue: gallery },
    ],
  }).compile();

  return {
    moduleRef,
    service: moduleRef.get(EventsService),
    repository,
    gallery,
  };
}
