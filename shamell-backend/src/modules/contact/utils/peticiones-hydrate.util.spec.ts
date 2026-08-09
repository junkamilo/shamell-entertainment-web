import { ContactRequestStatus } from '@prisma/client';
import { createPrismaMock } from '../../../testing';
import {
  makeContactRequestRow,
  makePeticionesFeedRow,
} from '../__mocks__/contact.fixtures';
import { hydratePeticionesPage } from './peticiones-hydrate.util';

describe('peticiones-hydrate.util', () => {
  const prisma = createPrismaMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hydrates CONTACT origin rows', async () => {
    const contact = makeContactRequestRow({ id: 'c-1' });
    prisma.contactRequest.findMany.mockResolvedValue([
      { ...contact, _count: { bookings: 0 } },
    ]);
    prisma.booking.findMany.mockResolvedValue([]);

    const result = await hydratePeticionesPage(
      prisma as never,
      [makePeticionesFeedRow({ origin: 'CONTACT', id: 'c-1' })],
      1,
      10,
      1,
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      origin: 'CONTACT',
      id: 'c-1',
      state: ContactRequestStatus.PENDING,
      hasLinkedBooking: false,
    });
    expect(result.meta.totalItems).toBe(1);
  });

  it('hydrates BOOKING_ADMIN origin with optional linked contact', async () => {
    const linked = makeContactRequestRow({ id: 'c-linked' });
    prisma.contactRequest.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([linked]);
    prisma.booking.findMany.mockResolvedValue([
      {
        id: 'b-1',
        createdAt: new Date('2026-06-01T12:00:00.000Z'),
        status: 'CONFIRMED',
        contactRequestId: 'c-linked',
      },
    ]);

    const result = await hydratePeticionesPage(
      prisma as never,
      [
        makePeticionesFeedRow({
          origin: 'BOOKING_ADMIN',
          id: 'b-1',
        }),
      ],
      1,
      10,
      1,
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      origin: 'BOOKING_ADMIN',
      id: 'b-1',
      linkedContact: linked,
    });
  });
});
