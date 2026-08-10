import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UpcomingExperienceType } from '@prisma/client';
import { createPrismaMock } from '../../../testing';
import { createUpcomingEventsRepositoryMock } from '../__mocks__/upcoming-events.repository.mock';
import { UpcomingEventsAdminSessionsService } from './upcoming-events-admin-sessions.service';
import { UpcomingEventsRepository } from './upcoming-events.repository';

describe('UpcomingEventsAdminSessionsService', () => {
  const repository = createUpcomingEventsRepositoryMock();
  const prisma = createPrismaMock();
  let service: UpcomingEventsAdminSessionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue(prisma);
    repository.findAdminUpcomingEventOrThrow.mockResolvedValue({
      id: 'event-1',
      experienceType: UpcomingExperienceType.CLASSES,
      eventType: { name: 'Salsa' },
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpcomingEventsAdminSessionsService,
        { provide: UpcomingEventsRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(UpcomingEventsAdminSessionsService);
  });

  it('listAdminSessions maps rows', async () => {
    prisma.upcomingClassSession.findMany.mockResolvedValue([
      {
        id: 's1',
        eventId: 'event-1',
        startsAt: new Date('2026-08-20T18:00:00.000Z'),
        endsAt: new Date('2026-08-20T19:00:00.000Z'),
        timezone: 'America/New_York',
        capacity: 10,
        price: 50,
        currency: 'usd',
        isActive: true,
        sortOrder: 0,
      },
    ]);
    const rows = await service.listAdminSessions('event-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('s1');
  });

  it('createAdminSession rejects non-classes experience', async () => {
    repository.findAdminUpcomingEventOrThrow.mockResolvedValue({
      id: 'event-1',
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      eventType: { name: 'Gala' },
    });
    await expect(
      service.createAdminSession('event-1', {
        startsAt: '2026-08-20T18:00:00.000Z',
        endsAt: '2026-08-20T19:00:00.000Z',
        capacity: 10,
        price: 50,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateAdminSession throws when session missing', async () => {
    prisma.upcomingClassSession.findFirst.mockResolvedValue(null);
    await expect(
      service.updateAdminSession('event-1', 'missing', {
        startsAt: '2026-08-20T18:00:00.000Z',
        endsAt: '2026-08-20T19:00:00.000Z',
        capacity: 10,
        price: 50,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deleteAdminSession deletes existing row', async () => {
    prisma.upcomingClassSession.findFirst.mockResolvedValue({ id: 's1' });
    prisma.upcomingClassSession.delete.mockResolvedValue({});
    await expect(service.deleteAdminSession('event-1', 's1')).resolves.toEqual({
      message: 'Session deleted.',
    });
    expect(prisma.upcomingClassSession.delete).toHaveBeenCalledWith({
      where: { id: 's1' },
    });
  });
});
