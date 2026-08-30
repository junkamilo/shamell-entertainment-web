import { Test } from '@nestjs/testing';
import { EventPublicSection, EventTypeOccasionUsage } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import {
  adminEventListInclude,
  eventWithTypeAndGalleryInclude,
} from '../constants/events.constants';
import { eventsWhereForPublicSection } from '../utils/booking-inquiry-catalog.util';
import { EventsRepository } from './events.repository';

describe('EventsRepository', () => {
  let repository: EventsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (fn: (tx: typeof prisma) => Promise<unknown>) =>
        Promise.resolve(fn(prisma)),
    );
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(EventsRepository);
  });

  it('asPrisma returns the injected PrismaService', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('createEvent passes data + gallery include', async () => {
    prisma.event.create.mockResolvedValue({ id: 'evt-1' });
    await repository.createEvent({
      eventTypeId: 'et-1',
      description: 'Desc',
      items: ['A'],
      showOnHome: true,
      publicSection: EventPublicSection.GENERAL,
      slug: null,
      experienceType: null,
      classVariant: null,
      price: 100,
    });
    const createCalls = prisma.event.create.mock.calls as Array<
      [
        {
          data: {
            eventTypeId: string;
            description: string;
            price: number;
          };
        },
      ]
    >;
    expect(createCalls[0][0].data.eventTypeId).toBe('et-1');
    expect(createCalls[0][0].data.description).toBe('Desc');
    expect(createCalls[0][0].data.price).toBe(100);
    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        include: eventWithTypeAndGalleryInclude,
      }),
    );
  });

  it('createUpcomingEventWithVenueConfig creates event + PACKAGES draft config in one transaction', async () => {
    prisma.event.create.mockResolvedValue({
      id: 'evt-upcoming-1',
      publicSection: EventPublicSection.UPCOMING_EVENTS,
    });
    prisma.upcomingVenueConfig.upsert.mockResolvedValue({ id: 'vc-1' });

    const result = await repository.createUpcomingEventWithVenueConfig({
      eventTypeId: 'et-1',
      description: 'Desc',
      items: [],
      showOnHome: true,
      publicSection: EventPublicSection.UPCOMING_EVENTS,
      slug: 'gala',
      experienceType: null,
      classVariant: null,
    });

    expect(result.id).toBe('evt-upcoming-1');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.upcomingVenueConfig.upsert).toHaveBeenCalledWith({
      where: { eventId: 'evt-upcoming-1' },
      create: {
        eventId: 'evt-upcoming-1',
        clientEnabled: false,
        fixedTicketMode: 'PACKAGES',
        fixedTicketCapacity: null,
      },
      update: {},
    });
  });

  it('upsertUpcomingVenueConfig creates with PACKAGES draft defaults', async () => {
    prisma.upcomingVenueConfig.upsert.mockResolvedValue({ id: 'vc-1' });
    await repository.upsertUpcomingVenueConfig('evt-1');
    expect(prisma.upcomingVenueConfig.upsert).toHaveBeenCalledWith({
      where: { eventId: 'evt-1' },
      create: {
        eventId: 'evt-1',
        clientEnabled: false,
        fixedTicketMode: 'PACKAGES',
        fixedTicketCapacity: null,
      },
      update: {},
    });
  });

  it('findPublicEventsForSection applies section where', async () => {
    prisma.event.findMany.mockResolvedValue([]);
    await repository.findPublicEventsForSection(EventPublicSection.GENERAL);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        showOnHome: true,
        ...eventsWhereForPublicSection(EventPublicSection.GENERAL),
      },
      include: eventWithTypeAndGalleryInclude,
      orderBy: { createdAt: 'asc' },
    });
  });

  it('findAdminEvents uses admin include', async () => {
    prisma.event.findMany.mockResolvedValue([]);
    await repository.findAdminEvents(EventPublicSection.GENERAL);
    expect(prisma.event.findMany).toHaveBeenCalledWith({
      where: eventsWhereForPublicSection(EventPublicSection.GENERAL),
      include: adminEventListInclude,
      orderBy: { createdAt: 'asc' },
    });
  });

  it('updateEvent forwards data', async () => {
    prisma.event.update.mockResolvedValue({ id: 'evt-1' });
    await repository.updateEvent('evt-1', { description: 'New' });
    expect(prisma.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'evt-1' },
        data: { description: 'New' },
      }),
    );
  });

  it('getEventDeleteGuardCounts aggregates booking/seat/class', async () => {
    prisma.booking.count.mockResolvedValue(1);
    prisma.venueSeatReservation.count.mockResolvedValue(2);
    prisma.upcomingClassEnrollment.count.mockResolvedValue(3);
    await expect(
      repository.getEventDeleteGuardCounts('evt-1'),
    ).resolves.toEqual({
      bookingCount: 1,
      seatReservationCount: 2,
      classEnrollmentCount: 3,
    });
    expect(prisma.booking.count).toHaveBeenCalledWith({
      where: { eventId: 'evt-1' },
    });
  });

  it('replaceOccasionAssignments runs in a transaction', async () => {
    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(fn(prisma)),
    );
    prisma.eventTypeOccasion.deleteMany.mockResolvedValue({ count: 0 });
    prisma.eventTypeOccasion.createMany.mockResolvedValue({ count: 1 });
    await repository.replaceOccasionAssignments('et-1', [
      {
        occasionTypeId: 'occ-1',
        usage: EventTypeOccasionUsage.OCCASION_SINGLE,
      },
    ]);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.eventTypeOccasion.deleteMany).toHaveBeenCalledWith({
      where: { eventTypeId: 'et-1' },
    });
    expect(prisma.eventTypeOccasion.createMany).toHaveBeenCalledWith({
      data: [
        {
          eventTypeId: 'et-1',
          occasionTypeId: 'occ-1',
          usage: EventTypeOccasionUsage.OCCASION_SINGLE,
          sortOrder: 0,
        },
      ],
    });
  });

  it('clearOccasionAssignments deletes links', async () => {
    prisma.eventTypeOccasion.deleteMany.mockResolvedValue({ count: 2 });
    await repository.clearOccasionAssignments('et-1');
    expect(prisma.eventTypeOccasion.deleteMany).toHaveBeenCalledWith({
      where: { eventTypeId: 'et-1' },
    });
  });
});
