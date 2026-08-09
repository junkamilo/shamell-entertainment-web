import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeVenueSeatReservationLite } from '../__mocks__/venue-reservations.fixtures';
import { VenueReservationsRepository } from './venue-reservations.repository';

describe('VenueReservationsRepository', () => {
  let repository: VenueReservationsRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        VenueReservationsRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(VenueReservationsRepository);
  });

  it('asPrisma returns injected client', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('findReservationByCheckoutSessionId looks up by session id', async () => {
    const row = makeVenueSeatReservationLite();
    prisma.venueSeatReservation.findUnique.mockResolvedValue(row);
    await expect(
      repository.findReservationByCheckoutSessionId('cs_test_1'),
    ).resolves.toEqual(row);
    expect(prisma.venueSeatReservation.findUnique).toHaveBeenCalledWith({
      where: { stripeCheckoutSessionId: 'cs_test_1' },
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
