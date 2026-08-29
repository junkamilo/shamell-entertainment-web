import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ReservationEventScheduleMode } from '@prisma/client';
import { ReservationEventTemplatesService } from '../../reservation-event-templates/services/reservation-event-templates.service';
import { createPrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingFixedEventPackagesRepository } from '../packages/upcoming-fixed-event-packages.repository';
import { UpcomingEventsRepository } from './upcoming-events.repository';
import { UpcomingEventsVenueConfigService } from './upcoming-events-venue-config.service';

describe('UpcomingEventsVenueConfigService', () => {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  const reservationTemplates = { findByIdOrThrow: jest.fn() };
  const packagesRepository = {
    countActivePackagesByEvent: jest.fn(),
    minActivePackagePriceCents: jest.fn(),
  };
  let service: UpcomingEventsVenueConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prisma);
    repository.findAdminUpcomingEventOrThrow.mockResolvedValue({
      id: 'event-1',
      experienceType: null,
      eventType: { name: 'Event' },
    });
    packagesRepository.countActivePackagesByEvent.mockResolvedValue(0);
    packagesRepository.minActivePackagePriceCents.mockResolvedValue(null);
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpcomingEventsVenueConfigService,
        { provide: UpcomingEventsRepository, useValue: repository },
        {
          provide: ReservationEventTemplatesService,
          useValue: reservationTemplates,
        },
        {
          provide: UpcomingFixedEventPackagesRepository,
          useValue: packagesRepository,
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

  it('upsertAdminVenueConfig allows PACKAGES with zero packages', async () => {
    const template = {
      id: 'tpl-fixed-1',
      scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      eventDate: new Date('2026-09-01T19:00:00.000Z'),
      eventStartTime: '19:00',
      eventEndTime: '23:00',
      salesStartDate: new Date('2026-01-01T00:00:00.000Z'),
      salesEndDate: new Date('2026-12-31T23:59:59.999Z'),
      timezone: 'America/New_York',
      name: 'Gala Fixed',
      weekdays: [] as Array<{ weekday: number; isActive: boolean }>,
      recurringStartTime: null,
      recurringEndTime: null,
    };
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);
    reservationTemplates.findByIdOrThrow.mockResolvedValue(template);
    packagesRepository.minActivePackagePriceCents.mockResolvedValue(null);
    const savedConfig = {
      id: 'config-1',
      eventId: 'event-1',
      clientEnabled: false,
      promoTitle: null,
      promoDescription: null,
      promoImageUrl: null,
      reservationEventDate: template.eventDate,
      reservationOpensAt: template.salesStartDate,
      reservationClosesAt: template.salesEndDate,
      reservationEventLabel: 'Gala Fixed',
      reservationTimezone: 'America/New_York',
      floorLayoutId: null,
      fixedTicketCapacity: null,
      fixedTicketMode: 'PACKAGES',
      classPackageEnabled: false,
      classPackagePrice: null,
      classPackageLabel: null,
      reservationEventTemplateId: 'tpl-fixed-1',
      reservationEventTemplate: template,
    };
    prisma.upcomingVenueConfig.upsert.mockResolvedValue(savedConfig);

    const result = await service.upsertAdminVenueConfig('event-1', {
      reservationEventTemplateId: 'tpl-fixed-1',
      fixedTicketMode: 'PACKAGES',
      clientEnabled: false,
    });

    expect(result.fixedTicketMode).toBe('PACKAGES');
    expect(prisma.upcomingVenueConfig.upsert).toHaveBeenCalled();
    expect(packagesRepository.minActivePackagePriceCents).toHaveBeenCalledWith(
      'event-1',
    );
  });

  it('getVenueConfigForEvent returns null when missing', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue(null);
    await expect(service.getVenueConfigForEvent('event-1')).resolves.toBeNull();
  });
});
