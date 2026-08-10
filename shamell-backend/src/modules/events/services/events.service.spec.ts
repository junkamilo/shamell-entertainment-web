import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  EventPublicSection,
  EventTypeCatalogChannel,
  EventTypeOccasionUsage,
  GalleryMediaType,
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import {
  makeCreateEventDto,
  makeEventRow,
  makeEventTypeRow,
  makeHubVenueConfigStub,
  makeOccasionTypeRow,
} from '../__mocks__/events.fixtures';
import { createEventsServiceTestModule } from '../testing/events-service.test-module';
import type { EventsServiceTestHarness } from '../testing/events-service.test-module';

describe('EventsService', () => {
  let harness: EventsServiceTestHarness;
  let service: EventsServiceTestHarness['service'];
  let repository: EventsServiceTestHarness['repository'];
  let gallery: EventsServiceTestHarness['gallery'];

  beforeEach(async () => {
    harness = await createEventsServiceTestModule();
    service = harness.service;
    repository = harness.repository;
    gallery = harness.gallery;
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue({});
    repository.groupActiveClassSessionsByEvent.mockResolvedValue([]);
    repository.findHubVenueConfigs.mockResolvedValue([]);
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

  it('getPublicUpcomingHubEvents returns empty when no hub rows', async () => {
    repository.findPublicUpcomingHubEvents.mockResolvedValue([]);
    await expect(service.getPublicUpcomingHubEvents()).resolves.toEqual([]);
  });

  it('hub enrich FIXED_EVENT attaches capacity and start', async () => {
    repository.findPublicUpcomingHubEvents.mockResolvedValue([
      makeEventRow({
        id: 'evt-fixed',
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: null,
        slug: 'fixed-gala',
        price: 75,
      }),
    ]);
    repository.findHubVenueConfigs.mockResolvedValue([
      makeHubVenueConfigStub({
        eventId: 'evt-fixed',
        clientEnabled: false,
        fixedTicketCapacity: 40,
        reservationEventDate: new Date('2026-09-15T00:00:00.000Z'),
        reservationEventTemplate: {
          scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        },
      }),
    ]);

    const result = await service.getPublicUpcomingHubEvents();
    expect(result[0].fixedTicketCapacity).toBe(40);
    expect(
      typeof result[0].eventStartsAt === 'string' ||
        result[0].eventStartsAt == null,
    ).toBe(true);
    expect(result[0].purchaseMode).toBeDefined();
  });

  it('hub enrich VENUE_SEATING uses clientEnabled reservation date', async () => {
    repository.findPublicUpcomingHubEvents.mockResolvedValue([
      makeEventRow({
        id: 'evt-venue',
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.VENUE_SEATING,
        slug: 'venue-night',
        price: 0,
      }),
    ]);
    repository.findHubVenueConfigs.mockResolvedValue([
      makeHubVenueConfigStub({
        eventId: 'evt-venue',
        clientEnabled: true,
        reservationEventDate: new Date('2026-10-01T00:00:00.000Z'),
        reservationOpensAt: new Date('2026-08-01T00:00:00.000Z'),
        reservationClosesAt: new Date('2026-10-01T23:59:59.000Z'),
        reservationEventTemplate: {
          scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        },
      }),
    ]);

    const result = await service.getPublicUpcomingHubEvents();
    expect(result[0].experienceType).toBe(UpcomingExperienceType.VENUE_SEATING);
    expect(result[0].purchasable).toBeDefined();
  });

  it('hub enrich CLASSES marks hasActiveSessions from group counts', async () => {
    repository.findPublicUpcomingHubEvents.mockResolvedValue([
      makeEventRow({
        id: 'evt-class',
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.CLASSES,
        slug: 'salsa',
        price: 50,
      }),
    ]);
    repository.groupActiveClassSessionsByEvent.mockResolvedValue([
      { eventId: 'evt-class', _count: { _all: 3 } },
    ]);
    repository.findHubVenueConfigs.mockResolvedValue([
      makeHubVenueConfigStub({
        eventId: 'evt-class',
        clientEnabled: true,
      }),
    ]);

    const result = await service.getPublicUpcomingHubEvents();
    expect(result[0].hasActiveSessions).toBe(true);
    expect(repository.groupActiveClassSessionsByEvent).toHaveBeenCalled();
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

  it('getAdminEvents maps booking and gallery counts', async () => {
    repository.findAdminEvents.mockResolvedValue([
      {
        ...makeEventRow(),
        _count: { bookings: 4, galleryPhotos: 2 },
      },
    ]);
    const result = await service.getAdminEvents({
      publicSection: EventPublicSection.GENERAL,
    });
    expect(result[0].bookingCount).toBe(4);
    expect(result[0].galleryPhotoCount).toBe(2);
  });

  it('getAdminEventById NotFound when missing', async () => {
    repository.findAdminEventById.mockResolvedValue(null);
    await expect(service.getAdminEventById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getAdminEventById maps event', async () => {
    repository.findAdminEventById.mockResolvedValue(makeEventRow());
    const result = await service.getAdminEventById('evt-1');
    expect(result.id).toBe('evt-1');
    expect(result.eventTypeName).toBe('Wedding');
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

  it('createEvent UPCOMING upserts venue config', async () => {
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({
        catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB,
        isActive: true,
      }),
    );
    repository.findEventTypeName.mockResolvedValue({ name: 'Gala' });
    repository.createEvent.mockResolvedValue(
      makeEventRow({
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        slug: 'gala',
        experienceType: UpcomingExperienceType.VENUE_SEATING,
      }),
    );
    repository.upsertUpcomingVenueConfig.mockResolvedValue({});

    await service.createEvent(
      makeCreateEventDto({
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.VENUE_SEATING,
        slug: 'gala',
      }),
    );
    expect(repository.upsertUpcomingVenueConfig).toHaveBeenCalledWith('evt-1');
  });

  it('createEvent maps P2002 to ConflictException', async () => {
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({ isActive: true }),
    );
    repository.findEventTypeName.mockResolvedValue({ name: 'Wedding' });
    repository.createEvent.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.createEvent(makeCreateEventDto()),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('createEvent conflicts when event type name already has an event', async () => {
    repository.findEventTypeByIdForWrite.mockResolvedValue(null);
    repository.findEventTypeByNameInChannel.mockResolvedValue(
      makeEventTypeRow({ isActive: true }),
    );
    repository.findEventByEventTypeId.mockResolvedValue({ id: 'evt-existing' });

    await expect(
      service.createEvent(
        makeCreateEventDto({
          eventTypeId: undefined,
          eventTypeName: 'Wedding',
        }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.createEvent).not.toHaveBeenCalled();
  });

  it('createEvent rejects inactive event type id', async () => {
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({ isActive: false }),
    );
    await expect(
      service.createEvent(makeCreateEventDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createEvent rejects catalog channel mismatch', async () => {
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({
        catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB,
        isActive: true,
      }),
    );
    await expect(
      service.createEvent(makeCreateEventDto()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createEvent creates inline type when name is new', async () => {
    repository.findEventTypeByNameInChannel.mockResolvedValue(null);
    repository.createEventTypeInline.mockResolvedValue(
      makeEventTypeRow({ id: 'et-inline', name: 'New Type' }),
    );
    repository.findEventTypeName.mockResolvedValue({ name: 'New Type' });
    repository.createEvent.mockResolvedValue(
      makeEventRow({ eventTypeId: 'et-inline' }),
    );

    await service.createEvent(
      makeCreateEventDto({
        eventTypeId: undefined,
        eventTypeName: 'New Type',
      }),
    );
    expect(repository.createEventTypeInline).toHaveBeenCalled();
  });

  it('createEvent activates inactive existing type by name', async () => {
    repository.findEventTypeByNameInChannel.mockResolvedValue(
      makeEventTypeRow({ isActive: false }),
    );
    repository.findEventByEventTypeId.mockResolvedValue(null);
    repository.activateEventType.mockResolvedValue({});
    repository.findEventTypeName.mockResolvedValue({ name: 'Wedding' });
    repository.createEvent.mockResolvedValue(makeEventRow());

    await service.createEvent(
      makeCreateEventDto({
        eventTypeId: undefined,
        eventTypeName: 'Wedding',
      }),
    );
    expect(repository.activateEventType).toHaveBeenCalledWith('et-1');
  });

  it('createEvent requires type id or name', async () => {
    await expect(
      service.createEvent(
        makeCreateEventDto({
          eventTypeId: undefined,
          eventTypeName: '   ',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateEvent blocks disable when bookings exist', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.countBookingsForEvent.mockResolvedValue(3);

    await expect(
      service.updateEvent('evt-1', { isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repository.updateEvent).not.toHaveBeenCalled();
  });

  it('updateEvent rejects publicSection change', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });

    await expect(
      service.updateEvent('evt-1', {
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateEvent happy path updates description', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.updateEvent.mockResolvedValue(
      makeEventRow({ description: 'Updated copy.' }),
    );

    const result = await service.updateEvent('evt-1', {
      description: 'Updated copy.',
    });
    expect(result.message).toContain('updated');
    expect(result.event.description).toBe('Updated copy.');
  });

  it('updateEvent renames type when name free', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.findDuplicateEventTypeName.mockResolvedValue(null);
    repository.renameEventType.mockResolvedValue({});
    repository.updateEvent.mockResolvedValue(makeEventRow());

    await service.updateEvent('evt-1', { eventTypeName: 'Renamed' });
    expect(repository.renameEventType).toHaveBeenCalledWith('et-1', 'Renamed');
  });

  it('updateEvent conflicts when renamed type name is taken by another event', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.findDuplicateEventTypeName.mockResolvedValue(
      makeEventTypeRow({ id: 'et-other' }),
    );
    repository.findEventByEventTypeId.mockResolvedValue({ id: 'evt-other' });

    await expect(
      service.updateEvent('evt-1', { eventTypeName: 'Taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateEvent VENUE_SEATING upserts venue config', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.UPCOMING_EVENTS,
    });
    repository.updateEvent.mockResolvedValue(
      makeEventRow({
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        experienceType: UpcomingExperienceType.VENUE_SEATING,
      }),
    );
    repository.upsertUpcomingVenueConfig.mockResolvedValue({});

    await service.updateEvent('evt-1', {
      experienceType: UpcomingExperienceType.VENUE_SEATING,
    });
    expect(repository.upsertUpcomingVenueConfig).toHaveBeenCalledWith('evt-1');
  });

  it('updateEvent maps P2002 when switching eventTypeId', async () => {
    repository.findEventForUpdate.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.GENERAL,
    });
    repository.findEventTypeByIdForWrite.mockResolvedValue(
      makeEventTypeRow({ id: 'et-2', isActive: true }),
    );
    repository.updateEvent.mockRejectedValue({ code: 'P2002' });

    await expect(
      service.updateEvent('evt-1', { eventTypeId: 'et-2' }),
    ).rejects.toBeInstanceOf(ConflictException);
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

  it('deleteEvent blocked when seat reservations exist', async () => {
    repository.findEventForDelete.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.UPCOMING_EVENTS,
    });
    repository.getEventDeleteGuardCounts.mockResolvedValue({
      bookingCount: 0,
      seatReservationCount: 1,
      classEnrollmentCount: 0,
    });

    await expect(service.deleteEvent('evt-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.deleteEvent).not.toHaveBeenCalled();
  });

  it('deleteEvent blocked when class enrollments exist', async () => {
    repository.findEventForDelete.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.UPCOMING_EVENTS,
    });
    repository.getEventDeleteGuardCounts.mockResolvedValue({
      bookingCount: 0,
      seatReservationCount: 0,
      classEnrollmentCount: 2,
    });

    await expect(service.deleteEvent('evt-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
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

  it('deleteEvent UPCOMING cleans linked template and orphan type', async () => {
    repository.findEventForDelete.mockResolvedValue({
      id: 'evt-1',
      eventTypeId: 'et-1',
      publicSection: EventPublicSection.UPCOMING_EVENTS,
    });
    repository.getEventDeleteGuardCounts.mockResolvedValue({
      bookingCount: 0,
      seatReservationCount: 0,
      classEnrollmentCount: 0,
    });
    repository.findVenueConfigTemplateId.mockResolvedValue({
      reservationEventTemplateId: 'tmpl-1',
    });
    repository.findGalleryPhotoIdsForEvent.mockResolvedValue([]);
    repository.deleteEvent.mockResolvedValue({});
    repository.deleteReservationTemplateIfUnlinked.mockResolvedValue({});
    repository.deleteOrphanInlineEventType.mockResolvedValue({});

    await service.deleteEvent('evt-1');
    expect(repository.deleteReservationTemplateIfUnlinked).toHaveBeenCalledWith(
      'tmpl-1',
    );
    expect(repository.deleteOrphanInlineEventType).toHaveBeenCalledWith('et-1');
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

  it('getPublicCatalogById NotFound when missing', async () => {
    repository.findPublicCatalogEventById.mockResolvedValue(null);
    await expect(
      service.getPublicCatalogById('missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('createEventType smoke creates and maps admin type', async () => {
    const created = makeEventTypeRow({ id: 'et-new', name: 'Corporate' });
    repository.createBookingEventType.mockResolvedValue(created);
    repository.findEventTypeAdminById.mockResolvedValue({
      ...created,
      occasionLinks: [],
    });

    const result = await service.createEventType({ name: 'Corporate' });
    expect(result.message).toContain('created');
    expect(result.eventType.name).toBe('Corporate');
  });

  it('createEventType syncs occasion assignments', async () => {
    const created = makeEventTypeRow({ id: 'et-new', name: 'Corporate' });
    repository.createBookingEventType.mockResolvedValue(created);
    repository.findActiveOccasionIds.mockResolvedValue([{ id: 'occ-1' }]);
    repository.replaceOccasionAssignments.mockResolvedValue({});
    repository.findEventTypeAdminById.mockResolvedValue({
      ...created,
      occasionLinks: [],
    });

    await service.createEventType({
      name: 'Corporate',
      occasions: [
        {
          occasionTypeId: 'occ-1',
          usage: EventTypeOccasionUsage.OCCASION_SINGLE,
        },
      ],
    });
    expect(repository.replaceOccasionAssignments).toHaveBeenCalled();
  });

  it('createEventType maps P2002 to ConflictException', async () => {
    repository.createBookingEventType.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.createEventType({ name: 'Wedding' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('getPublicEventTypes maps booking types', async () => {
    repository.findPublicBookingEventTypes.mockResolvedValue([
      makeEventTypeRow(),
    ]);
    const result = await service.getPublicEventTypes();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wedding');
  });

  it('getAdminEventTypes maps counts', async () => {
    repository.findAdminEventTypes.mockResolvedValue([
      {
        ...makeEventTypeRow(),
        occasionLinks: [],
        _count: { events: 1, bookings: 2, galleryPhotos: 3 },
      },
    ]);
    const result = await service.getAdminEventTypes();
    expect(result[0].eventCount).toBe(1);
    expect(result[0].bookingCount).toBe(2);
    expect(result[0].galleryPhotoCount).toBe(3);
  });

  it('updateEventType smoke updates name', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.updateEventType.mockResolvedValue({});
    repository.findEventTypeAdminById.mockResolvedValue({
      ...makeEventTypeRow({ name: 'Gala' }),
      occasionLinks: [],
    });

    const result = await service.updateEventType('et-1', { name: 'Gala' });
    expect(result.message).toContain('updated');
    expect(result.eventType.name).toBe('Gala');
  });

  it('updateEventType clears occasions when empty list', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.clearOccasionAssignments.mockResolvedValue({});
    repository.findEventTypeAdminById.mockResolvedValue({
      ...makeEventTypeRow(),
      occasionLinks: [],
    });

    await service.updateEventType('et-1', { occasions: [] });
    expect(repository.clearOccasionAssignments).toHaveBeenCalledWith('et-1');
  });

  it('updateEventType rejects duplicate occasion ids', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    await expect(
      service.updateEventType('et-1', {
        occasions: [
          {
            occasionTypeId: 'occ-1',
            usage: EventTypeOccasionUsage.OCCASION_SINGLE,
          },
          {
            occasionTypeId: 'occ-1',
            usage: EventTypeOccasionUsage.BESPOKE_PROJECT,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateEventType rejects inactive occasion ids', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.findActiveOccasionIds.mockResolvedValue([]);
    await expect(
      service.updateEventType('et-1', {
        occasions: [
          {
            occasionTypeId: 'occ-missing',
            usage: EventTypeOccasionUsage.OCCASION_SINGLE,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateEventType blocks disable when type has catalog events', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.getEventTypeUsageCounts.mockResolvedValue({
      eventCount: 1,
      bookingCount: 0,
      galleryCount: 0,
    });
    await expect(
      service.updateEventType('et-1', { isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateEventType blocks disable when bookings exist', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.getEventTypeUsageCounts.mockResolvedValue({
      eventCount: 0,
      bookingCount: 2,
      galleryCount: 0,
    });
    await expect(
      service.updateEventType('et-1', { isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateEventType blocks disable when gallery linked', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.getEventTypeUsageCounts.mockResolvedValue({
      eventCount: 0,
      bookingCount: 0,
      galleryCount: 1,
    });
    await expect(
      service.updateEventType('et-1', { isActive: false }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('updateEventType maps P2002 to ConflictException', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.updateEventType.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.updateEventType('et-1', { name: 'Taken' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deleteEventType smoke deletes when unused', async () => {
    repository.findEventTypeId.mockResolvedValue({ id: 'et-1' });
    repository.getEventTypeUsageCounts.mockResolvedValue({
      eventCount: 0,
      bookingCount: 0,
      galleryCount: 0,
    });
    repository.deleteEventType.mockResolvedValue({});

    const result = await service.deleteEventType('et-1');
    expect(result.message).toContain('deleted');
    expect(repository.deleteEventType).toHaveBeenCalledWith('et-1');
  });

  it('deleteEventType NotFound when missing', async () => {
    repository.findEventTypeId.mockResolvedValue(null);
    await expect(service.deleteEventType('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('occasion types', () => {
    it('getAdminOccasionTypes maps counts', async () => {
      repository.findAdminOccasionTypes.mockResolvedValue([
        makeOccasionTypeRow({
          _count: { bookings: 2, eventLinks: 1 },
        }),
      ]);
      const result = await service.getAdminOccasionTypes();
      expect(result[0].bookingCount).toBe(2);
      expect(result[0].eventTypeLinkCount).toBe(1);
    });

    it('createOccasionType happy path', async () => {
      repository.createOccasionType.mockResolvedValue(
        makeOccasionTypeRow({ name: 'Anniversary' }),
      );
      const result = await service.createOccasionType({ name: 'Anniversary' });
      expect(result.message).toContain('created');
      expect(result.occasionType.name).toBe('Anniversary');
    });

    it('createOccasionType maps P2002', async () => {
      repository.createOccasionType.mockRejectedValue({ code: 'P2002' });
      await expect(
        service.createOccasionType({ name: 'Birthday' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updateOccasionType happy path', async () => {
      repository.findOccasionTypeId.mockResolvedValue({ id: 'occ-1' });
      repository.updateOccasionType.mockResolvedValue(
        makeOccasionTypeRow({ name: 'Updated' }),
      );
      const result = await service.updateOccasionType('occ-1', {
        name: 'Updated',
      });
      expect(result.occasionType.name).toBe('Updated');
    });

    it('updateOccasionType NotFound', async () => {
      repository.findOccasionTypeId.mockResolvedValue(null);
      await expect(
        service.updateOccasionType('missing', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updateOccasionType blocks disable with bookings', async () => {
      repository.findOccasionTypeId.mockResolvedValue({ id: 'occ-1' });
      repository.countBookingsForOccasion.mockResolvedValue(1);
      await expect(
        service.updateOccasionType('occ-1', { isActive: false }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('updateOccasionType maps P2002', async () => {
      repository.findOccasionTypeId.mockResolvedValue({ id: 'occ-1' });
      repository.updateOccasionType.mockRejectedValue({ code: 'P2002' });
      await expect(
        service.updateOccasionType('occ-1', { name: 'Taken' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('deleteOccasionType happy path', async () => {
      repository.findOccasionTypeId.mockResolvedValue({ id: 'occ-1' });
      repository.countBookingsForOccasion.mockResolvedValue(0);
      repository.deleteOccasionType.mockResolvedValue({});
      const result = await service.deleteOccasionType('occ-1');
      expect(result.message).toContain('deleted');
    });

    it('deleteOccasionType blocked with bookings', async () => {
      repository.findOccasionTypeId.mockResolvedValue({ id: 'occ-1' });
      repository.countBookingsForOccasion.mockResolvedValue(3);
      await expect(service.deleteOccasionType('occ-1')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.deleteOccasionType).not.toHaveBeenCalled();
    });

    it('deleteOccasionType NotFound when missing', async () => {
      repository.findOccasionTypeId.mockResolvedValue(null);
      await expect(
        service.deleteOccasionType('missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('NotFound and non-P2002 rethrows', () => {
    it('createEvent NotFound when eventTypeId missing', async () => {
      repository.findEventTypeByIdForWrite.mockResolvedValue(null);
      await expect(
        service.createEvent(makeCreateEventDto()),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('createEvent rethrows non-P2002 errors', async () => {
      repository.findEventTypeByIdForWrite.mockResolvedValue(
        makeEventTypeRow({ isActive: true }),
      );
      repository.findEventTypeName.mockResolvedValue({ name: 'Wedding' });
      repository.createEvent.mockRejectedValue(new Error('db boom'));
      await expect(service.createEvent(makeCreateEventDto())).rejects.toThrow(
        'db boom',
      );
    });

    it('updateEvent NotFound when missing', async () => {
      repository.findEventForUpdate.mockResolvedValue(null);
      await expect(
        service.updateEvent('missing', { description: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updateEvent rethrows non-P2002 errors', async () => {
      repository.findEventForUpdate.mockResolvedValue({
        id: 'evt-1',
        eventTypeId: 'et-1',
        publicSection: EventPublicSection.GENERAL,
      });
      repository.updateEvent.mockRejectedValue(new Error('update boom'));
      await expect(
        service.updateEvent('evt-1', { description: 'x' }),
      ).rejects.toThrow('update boom');
    });

    it('deleteEvent NotFound when missing', async () => {
      repository.findEventForDelete.mockResolvedValue(null);
      await expect(service.deleteEvent('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('createEventType rethrows non-P2002 errors', async () => {
      repository.createBookingEventType.mockRejectedValue(
        new Error('type boom'),
      );
      await expect(
        service.createEventType({ name: 'Corporate' }),
      ).rejects.toThrow('type boom');
    });

    it('updateEventType NotFound when missing', async () => {
      repository.findEventTypeId.mockResolvedValue(null);
      await expect(
        service.updateEventType('missing', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('createOccasionType rethrows non-P2002 errors', async () => {
      repository.createOccasionType.mockRejectedValue(new Error('occ boom'));
      await expect(
        service.createOccasionType({ name: 'Anniversary' }),
      ).rejects.toThrow('occ boom');
    });

    it('updateOccasionType rethrows non-P2002 errors', async () => {
      repository.findOccasionTypeId.mockResolvedValue({ id: 'occ-1' });
      repository.updateOccasionType.mockRejectedValue(new Error('occ upd'));
      await expect(
        service.updateOccasionType('occ-1', { name: 'X' }),
      ).rejects.toThrow('occ upd');
    });
  });
});
