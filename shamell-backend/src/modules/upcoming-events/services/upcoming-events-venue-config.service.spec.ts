import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ReservationEventTemplatesService } from '../../reservation-event-templates/services/reservation-event-templates.service';
import { createPrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { UpcomingEventsVenueConfigService } from './upcoming-events-venue-config.service';

describe('UpcomingEventsVenueConfigService', () => {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const reservationTemplates = { findByIdOrThrow: jest.fn() };
  let service: UpcomingEventsVenueConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prisma);
    repository.findAdminUpcomingEventOrThrow.mockResolvedValue({
      id: 'event-1',
      experienceType: null,
      eventType: { name: 'Event' },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpcomingEventsVenueConfigService,
        { provide: UpcomingEventsRepository, useValue: repository },
        {
          provide: ReservationEventTemplatesService,
          useValue: reservationTemplates,
        },
      ],
    }).compile();
    service = moduleRef.get(UpcomingEventsVenueConfigService);
  });

  it('getAdminVenueConfig returns null when missing', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);
    await expect(service.getAdminVenueConfig('event-1')).resolves.toBeNull();
  });

  it('resolveEventIdBySlug returns id', async () => {
    repository.findPublicUpcomingBySlug.mockResolvedValue({
      id: 'event-1',
      slug: 'gala',
    });
    await expect(service.resolveEventIdBySlug('gala')).resolves.toBe('event-1');
  });

  it('upsertAdminVenueConfig rejects invalid patch without template', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: 'event-1',
      reservationEventTemplate: null,
      clientEnabled: false,
    });
    await expect(
      service.upsertAdminVenueConfig('event-1', {
        promoTitle: 'x',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getVenueConfigForEvent returns null when missing', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);
    await expect(service.getVenueConfigForEvent('event-1')).resolves.toBeNull();
  });
});
