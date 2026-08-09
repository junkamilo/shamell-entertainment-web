import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { UpcomingEventsRepository } from './upcoming-events.repository';

describe('UpcomingEventsRepository', () => {
  let repository: UpcomingEventsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UpcomingEventsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(UpcomingEventsRepository);
  });

  it('asPrisma returns injected client', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('findClassEnrollmentByCheckoutSessionId looks up by session id', async () => {
    prisma.upcomingClassEnrollment.findUnique.mockResolvedValue({
      id: 'enroll-1',
    });
    await expect(
      repository.findClassEnrollmentByCheckoutSessionId('cs_1'),
    ).resolves.toEqual({ id: 'enroll-1' });
    expect(prisma.upcomingClassEnrollment.findUnique).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_1' },
    });
  });

  it('findVenueConfigByEventId looks up by eventId', async () => {
    prisma.upcomingVenueConfig.findUnique.mockResolvedValue({
      eventId: 'event-1',
    });
    await expect(
      repository.findVenueConfigByEventId('event-1'),
    ).resolves.toEqual({ eventId: 'event-1' });
  });
});
