import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UpcomingExperienceType } from '@prisma/client';
import { createPrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import { UpcomingEventsPublicService } from './upcoming-events-public.service';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { UpcomingEventsVenueConfigService } from './upcoming-events-venue-config.service';

describe('UpcomingEventsPublicService', () => {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const venueConfigService = {
    getVenueConfigForEvent: jest.fn(),
  };
  const packagesRepository = {
    listActiveActivitiesByEvent: jest.fn().mockResolvedValue([]),
    listPackagesByEvent: jest.fn().mockResolvedValue([]),
    findPackageById: jest.fn(),
  };
  let service: UpcomingEventsPublicService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prisma);
    repository.seatsRemaining.mockResolvedValue(5);
    repository.batchSeatsRemaining.mockResolvedValue(new Map());
    repository.findVenueConfigWithTemplate.mockResolvedValue(null);
    repository.findActiveClassSessionsForEvent.mockResolvedValue([]);
    packagesRepository.listActiveActivitiesByEvent.mockResolvedValue([]);
    packagesRepository.listPackagesByEvent.mockResolvedValue([]);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpcomingEventsPublicService,
        { provide: UpcomingEventsRepository, useValue: repository },
        {
          provide: UpcomingEventsVenueConfigService,
          useValue: venueConfigService,
        },
        {
          provide: UpcomingFixedEventPackagesRepository,
          useValue: packagesRepository,
        },
      ],
    }).compile();
    service = moduleRef.get(UpcomingEventsPublicService);
  });

  it('getPublicBySlug returns summary for classes event', async () => {
    repository.findPublicUpcomingBySlug.mockResolvedValue({
      id: 'event-1',
      slug: 'salsa',
      description: 'desc',
      items: [],
      price: 50,
      experienceType: UpcomingExperienceType.CLASSES,
      classVariant: null,
      eventType: { name: 'Salsa' },
      galleryPhotos: [],
    });
    const result = await service.getPublicBySlug('salsa');
    expect(result.slug).toBe('salsa');
    expect(result.eventTypeName).toBe('Salsa');
  });

  it('getPublicBySlug propagates NotFound', async () => {
    repository.findPublicUpcomingBySlug.mockRejectedValue(
      new NotFoundException('Upcoming event not found.'),
    );
    await expect(service.getPublicBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('getPublicVenueBundle rejects non venue seating', async () => {
    repository.findPublicUpcomingBySlug.mockResolvedValue({
      id: 'event-1',
      slug: 'salsa',
      experienceType: UpcomingExperienceType.CLASSES,
      eventType: { name: 'Salsa' },
      galleryPhotos: [],
      description: '',
      items: [],
      price: null,
      classVariant: null,
    });
    await expect(service.getPublicVenueBundle('salsa')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('listPublicSessions returns seatsRemaining', async () => {
    repository.findPublicUpcomingBySlug.mockResolvedValue({
      id: 'event-1',
      slug: 'salsa',
      description: '',
      items: [],
      price: 50,
      experienceType: UpcomingExperienceType.CLASSES,
      classVariant: null,
      eventType: { name: 'Salsa' },
      galleryPhotos: [],
    });
    repository.findActiveClassSessionsForEvent.mockResolvedValue([
      {
        id: 's1',
        startsAt: new Date('2026-08-20T18:00:00.000Z'),
        endsAt: new Date('2026-08-20T19:00:00.000Z'),
        timezone: 'America/New_York',
        capacity: 10,
        price: 50,
        currency: 'usd',
        weekday: 4,
        sectionId: null,
        section: null,
      },
    ]);
    repository.batchSeatsRemaining.mockResolvedValue(new Map([['s1', 3]]));
    const result = await service.listPublicSessions('salsa');
    expect(result.sessions[0].seatsRemaining).toBe(7);
  });
});
