import { Test } from '@nestjs/testing';
import { makePeticionesFeedRow } from '../__mocks__/contact.fixtures';
import { createContactRepositoryMock } from '../__mocks__/contact.repository.mock';
import type { AdminPeticionesQueryDto } from '../dto/admin-peticiones-query.dto';
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

function peticionesQuery(
  overrides: Partial<AdminPeticionesQueryDto> = {},
): AdminPeticionesQueryDto {
  return {
    page: 1,
    perPage: 10,
    lane: 'bookings',
    ...overrides,
  };
}

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

  describe('countPeticionesBadge', () => {
    it('routes by lane', async () => {
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

    it('passes since Date when since is a positive finite number', async () => {
      repository.countPeticionesBadgeBookings.mockResolvedValue(1);
      const since = Date.parse('2026-08-01T00:00:00.000Z');
      await service.countPeticionesBadge({ lane: 'bookings', since });
      const calls = repository.countPeticionesBadgeBookings.mock.calls as Array<
        [Date | null]
      >;
      expect(calls[0][0]).toEqual(new Date(since));
    });

    it('uses null since when since is missing, NaN, or non-positive', async () => {
      repository.countPeticionesBadgeGuidance.mockResolvedValue(0);
      await service.countPeticionesBadge({ lane: 'guidance' });
      await service.countPeticionesBadge({
        lane: 'guidance',
        since: Number.NaN,
      });
      await service.countPeticionesBadge({ lane: 'guidance', since: 0 });
      await service.countPeticionesBadge({ lane: 'guidance', since: -1 });
      const calls = repository.countPeticionesBadgeGuidance.mock.calls as Array<
        [Date | null]
      >;
      expect(calls.every((c) => c[0] === null)).toBe(true);
    });
  });

  describe('findAllPeticiones', () => {
    it('guidance empty total skips list', async () => {
      repository.countGuidanceFeed.mockResolvedValue(0);
      const result = await service.findAllPeticiones(
        peticionesQuery({ lane: 'guidance' }),
      );
      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(repository.listGuidanceFeed).not.toHaveBeenCalled();
    });

    it('guidance hydrates feed rows', async () => {
      repository.countGuidanceFeed.mockResolvedValue(1);
      const rows = [makePeticionesFeedRow({ id: 'g-1', origin: 'CONTACT' })];
      repository.listGuidanceFeed.mockResolvedValue(rows);
      const result = await service.findAllPeticiones(
        peticionesQuery({ lane: 'guidance', page: 2, perPage: 5 }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(1);
      expect(repository.listGuidanceFeed).toHaveBeenCalledWith(5, 5);
    });

    it('private_classes empty total skips list', async () => {
      repository.countPrivateClassesFeed.mockResolvedValue(0);
      const result = await service.findAllPeticiones(
        peticionesQuery({ lane: 'private_classes' }),
      );
      expect(result.items).toEqual([]);
      expect(repository.listPrivateClassesFeed).not.toHaveBeenCalled();
    });

    it('private_classes hydrates feed rows', async () => {
      repository.countPrivateClassesFeed.mockResolvedValue(2);
      const rows = [
        makePeticionesFeedRow({ id: 'pc-1', origin: 'BOOKING_ADMIN' }),
      ];
      repository.listPrivateClassesFeed.mockResolvedValue(rows);
      const result = await service.findAllPeticiones(
        peticionesQuery({ lane: 'private_classes' }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.meta.totalItems).toBe(2);
      expect(repository.listPrivateClassesFeed).toHaveBeenCalledWith(0, 10);
    });

    it('bookings empty total skips list', async () => {
      repository.countBookingsLaneOrphans.mockResolvedValue(0);
      repository.countBookingsLaneNonPrivate.mockResolvedValue(0);
      const result = await service.findAllPeticiones(
        peticionesQuery({ lane: 'bookings' }),
      );
      expect(result.items).toEqual([]);
      expect(result.meta.totalItems).toBe(0);
      expect(repository.listBookingsLaneFeed).not.toHaveBeenCalled();
    });

    it('bookings hydrates with pagination meta', async () => {
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

      const result = await service.findAllPeticiones(
        peticionesQuery({ lane: 'bookings' }),
      );

      expect(result.items).toHaveLength(2);
      expect(result.meta.totalItems).toBe(2);
      expect(repository.listBookingsLaneFeed).toHaveBeenCalledWith(0, 10);
    });

    it('defaults page/perPage when omitted', async () => {
      repository.countBookingsLaneOrphans.mockResolvedValue(0);
      repository.countBookingsLaneNonPrivate.mockResolvedValue(0);
      await service.findAllPeticiones({ lane: 'bookings' });
      expect(repository.countBookingsLaneOrphans).toHaveBeenCalled();
    });
  });
});
