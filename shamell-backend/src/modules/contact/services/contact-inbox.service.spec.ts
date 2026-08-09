import { Test } from '@nestjs/testing';
import { makePeticionesFeedRow } from '../__mocks__/contact.fixtures';
import { createContactRepositoryMock } from '../__mocks__/contact.repository.mock';
import { ContactInboxService } from './contact-inbox.service';
import { ContactRepository } from './contact.repository';

jest.mock('../utils/peticiones-hydrate.util', () => ({
  hydratePeticionesPage: jest.fn(
    (
      _prisma: unknown,
      feedRows: unknown[],
      page: number,
      perPage: number,
      totalItems: number,
    ) =>
      Promise.resolve({
        items: feedRows,
        meta: {
          page,
          perPage,
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / perPage)),
        },
      }),
  ),
}));

describe('ContactInboxService', () => {
  let service: ContactInboxService;
  const repository = createContactRepositoryMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    repository.asPrisma.mockReturnValue({});
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactInboxService,
        { provide: ContactRepository, useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(ContactInboxService);
  });

  it('countPeticionesBadge routes by lane', async () => {
    repository.countPeticionesBadgeGuidance.mockResolvedValue(2);
    repository.countPeticionesBadgePrivateClasses.mockResolvedValue(3);
    repository.countPeticionesBadgeBookings.mockResolvedValue(5);

    await expect(
      service.countPeticionesBadge({ lane: 'guidance' }),
    ).resolves.toEqual({ count: 2 });
    await expect(
      service.countPeticionesBadge({ lane: 'private_classes' }),
    ).resolves.toEqual({ count: 3 });
    await expect(
      service.countPeticionesBadge({ lane: 'bookings' }),
    ).resolves.toEqual({ count: 5 });
  });

  it('findAllPeticiones returns empty meta when total is 0', async () => {
    repository.countGuidanceFeed.mockResolvedValue(0);
    const result = await service.findAllPeticiones({
      page: 1,
      perPage: 10,
      lane: 'guidance',
    } as never);
    expect(result.items).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(repository.listGuidanceFeed).not.toHaveBeenCalled();
  });

  it('findAllPeticiones hydrates bookings lane with pagination meta', async () => {
    repository.countBookingsLaneOrphans.mockResolvedValue(1);
    repository.countBookingsLaneNonPrivate.mockResolvedValue(1);
    const rows = [
      makePeticionesFeedRow({ id: 'c-1' }),
      makePeticionesFeedRow({
        origin: 'BOOKING_ADMIN',
        id: 'b-1',
      }),
    ];
    repository.listBookingsLaneFeed.mockResolvedValue(rows);

    const result = await service.findAllPeticiones({
      page: 1,
      perPage: 10,
      lane: 'bookings',
    } as never);

    expect(result.items).toHaveLength(2);
    expect(result.meta.totalItems).toBe(2);
    expect(repository.listBookingsLaneFeed).toHaveBeenCalledWith(0, 10);
  });
});
