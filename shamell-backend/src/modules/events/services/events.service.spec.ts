import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EventPublicSection, GalleryMediaType } from '@prisma/client';
import { createGalleryServiceMock } from '../../gallery/__mocks__/gallery.service.mock';
import { GalleryService } from '../../gallery/services/gallery.service';
import {
  makeCreateEventDto,
  makeEventRow,
  makeEventTypeRow,
} from '../__mocks__/events.fixtures';
import { createEventsRepositoryMock } from '../__mocks__/events.repository.mock';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';

describe('EventsService', () => {
  let service: EventsService;
  const repository = createEventsRepositoryMock();
  const gallery = createGalleryServiceMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue({});
    repository.groupActiveClassSessionsByEvent.mockResolvedValue([]);
    repository.findHubVenueConfigs.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: repository },
        { provide: GalleryService, useValue: gallery },
      ],
    }).compile();
    service = moduleRef.get(EventsService);
  });

  it('getPublicEvents returns mapped general catalog', async () => {
    repository.findPublicEventsForSection.mockResolvedValue([makeEventRow()]);
    const result = await service.getPublicEvents({
      publicSection: EventPublicSection.GENERAL,
    });
    expect(result).toHaveLength(1);
    expect(result[0].eventTypeName).toBe('Wedding');
    expect(repository.findPublicEventsForSection).toHaveBeenCalledWith(
      EventPublicSection.GENERAL,
    );
  });

  it('getPublicEvents routes UPCOMING_EVENTS to hub enrich', async () => {
    repository.findPublicUpcomingHubEvents.mockResolvedValue([
      makeEventRow({
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        slug: 'gala',
      }),
    ]);
    const result = await service.getPublicEvents({
      publicSection: EventPublicSection.UPCOMING_EVENTS,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      hasActiveSessions: false,
    });
    expect(typeof result[0].salesOpen).toBe('boolean');
    expect(repository.findPublicUpcomingHubEvents).toHaveBeenCalled();
  });

  it('getContactLines merges events and orphan types', async () => {
    repository.findContactLineEvents.mockResolvedValue([
      {
        ...makeEventRow(),
        galleryPhotos: [],
        eventType: {
          ...makeEventTypeRow(),
          occasionLinks: [],
        },
      },
    ]);
    repository.findOrphanBookingEventTypes.mockResolvedValue([
      {
        id: 'et-orphan',
        name: 'Orphan',
        contactInquiryCode: null,
        occasionLinks: [],
      },
    ]);
    const lines = await service.getContactLines();
    expect(lines).toHaveLength(2);
    expect(lines[0].lineKind).toBe('event');
    expect(lines[1].lineKind).toBe('event_type');
  });

  it('createEvent happy path resolves type and maps result', async () => {
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({ isActive: true }),
    );
    repository.findEventTypeName.mockResolvedValue({ name: 'Wedding' });
    const created = makeEventRow();
    repository.createEvent.mockResolvedValue(created);

    const result = await service.createEvent(makeCreateEventDto());
    expect(result.message).toContain('created');
    expect(result.event.id).toBe('evt-1');
    expect(repository.createEvent).toHaveBeenCalled();
  });

  it('deleteEvent blocked when bookings exist', async () => {
    repository.findEventForDelete.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.getEventDeleteGuardCounts.mockResolvedValue({
      bookingCount: 2,
      seatReservationCount: 0,
      classEnrollmentCount: 0,
    });

    await expect(service.deleteEvent('evt-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.deleteEvent).not.toHaveBeenCalled();
  });

  it('deleteEvent cleans gallery then deletes', async () => {
    repository.findEventForDelete.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.getEventDeleteGuardCounts.mockResolvedValue({
      bookingCount: 0,
      seatReservationCount: 0,
      classEnrollmentCount: 0,
    });
    repository.findVenueConfigTemplateId.mockResolvedValue(null);
    repository.findGalleryPhotoIdsForEvent.mockResolvedValue([{ id: 'ph-1' }]);
    repository.deleteEvent.mockResolvedValue({});

    const deleted = await service.deleteEvent('evt-1');
    expect(deleted.message).toContain('deleted');
    expect(gallery.deletePhoto).toHaveBeenCalledWith('ph-1');
    expect(repository.deleteEvent).toHaveBeenCalledWith('evt-1');
  });

  it('getPublicCatalogById maps hero media type', async () => {
    repository.findPublicCatalogEventById.mockResolvedValue(
      makeEventRow({
        galleryPhotos: [
          {
            imageUrl: 'https://res.cloudinary.com/demo/video/upload/v1/x.mp4',
            mediaType: GalleryMediaType.IMAGE,
          },
        ],
      }),
    );
    const result = await service.getPublicCatalogById('evt-1');
    expect(result.heroMediaType).toBe(GalleryMediaType.VIDEO);
    expect(result.kind).toBe('event');
  });
});
