import { Test } from '@nestjs/testing';
import { ContactRequestStatus, BookingStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing';
import { makeContactRequestRow } from '../__mocks__/contact.fixtures';
import { ContactRepository } from './contact.repository';

describe('ContactRepository', () => {
  let repository: ContactRepository;
  const prisma = createPrismaMock();

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ContactRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(ContactRepository);
  });

  it('asPrisma returns injected prisma', () => {
    expect(repository.asPrisma()).toBe(prisma);
  });

  it('create forwards data to contactRequest.create', async () => {
    const row = makeContactRequestRow();
    prisma.contactRequest.create.mockResolvedValue(row);
    await expect(
      repository.create({
        fullName: row.fullName,
        email: row.email,
        message: row.message,
        subject: row.subject,
        status: ContactRequestStatus.PENDING,
      }),
    ).resolves.toEqual(row);
    expect(prisma.contactRequest.create).toHaveBeenCalledWith({
      data: {
        fullName: row.fullName,
        email: row.email,
        message: row.message,
        subject: row.subject,
        status: ContactRequestStatus.PENDING,
      },
    });
  });

  it('findById / update / delete call prisma delegates', async () => {
    const row = makeContactRequestRow();
    prisma.contactRequest.findUnique.mockResolvedValue(row);
    prisma.contactRequest.update.mockResolvedValue(row);
    prisma.contactRequest.delete.mockResolvedValue(row);

    await expect(repository.findById('contact-1')).resolves.toEqual(row);
    await repository.update('contact-1', { isRead: true });
    await repository.delete('contact-1');

    expect(prisma.contactRequest.findUnique).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
    });
    expect(prisma.contactRequest.update).toHaveBeenCalled();
    expect(prisma.contactRequest.delete).toHaveBeenCalledWith({
      where: { id: 'contact-1' },
    });
  });

  it('findOccasionTypeNamesByIds skips empty ids', async () => {
    await expect(repository.findOccasionTypeNamesByIds([])).resolves.toEqual(
      [],
    );
    expect(prisma.occasionType.findMany.mock.calls).toHaveLength(0);
  });

  it('inbox badge counts invoke $queryRaw', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 3n }]);
    await expect(repository.countPeticionesBadgeBookings(null)).resolves.toBe(
      3,
    );
    await expect(
      repository.countPeticionesBadgeGuidance(new Date(1)),
    ).resolves.toBe(3);
    await expect(
      repository.countPeticionesBadgePrivateClasses(null),
    ).resolves.toBe(3);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('runTransaction forwards to prisma.$transaction', async () => {
    prisma.$transaction.mockImplementation(
      (fn: (tx: unknown) => Promise<unknown>) =>
        Promise.resolve(fn({ ok: true })),
    );
    const result = await repository.runTransaction((tx) => Promise.resolve(tx));
    expect(result).toEqual({ ok: true });
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('count and findMany forward to contactRequest delegates', async () => {
    const row = makeContactRequestRow();
    prisma.contactRequest.count.mockResolvedValue(5);
    prisma.contactRequest.findMany.mockResolvedValue([row]);

    await expect(
      repository.count({ status: ContactRequestStatus.PENDING }),
    ).resolves.toBe(5);
    await expect(
      repository.findMany({ where: { isRead: false }, skip: 0, take: 10 }),
    ).resolves.toEqual([row]);
    expect(prisma.contactRequest.count).toHaveBeenCalledWith({
      where: { status: ContactRequestStatus.PENDING },
    });
    expect(prisma.contactRequest.findMany).toHaveBeenCalledWith({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 10,
    });
  });

  it('findEventTypeNameById delegates to eventType.findUnique', async () => {
    prisma.eventType.findUnique.mockResolvedValue({ name: 'Wedding' });
    await expect(
      repository.findEventTypeNameById('evt-type-1'),
    ).resolves.toEqual({
      name: 'Wedding',
    });
    expect(prisma.eventType.findUnique).toHaveBeenCalledWith({
      where: { id: 'evt-type-1' },
      select: { name: true },
    });
  });

  it('findOccasionTypeNamesByIds queries prisma when ids present', async () => {
    prisma.occasionType.findMany.mockResolvedValue([
      { id: 'occ-1', name: 'Birthday' },
    ]);
    await expect(
      repository.findOccasionTypeNamesByIds(['occ-1']),
    ).resolves.toEqual([{ id: 'occ-1', name: 'Birthday' }]);
    expect(prisma.occasionType.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['occ-1'] } },
      select: { id: true, name: true },
    });
  });

  it('findActiveBookingContactRequestId delegates to booking.findFirst', async () => {
    const dayStart = new Date('2026-08-10T00:00:00.000Z');
    const dayEnd = new Date('2026-08-10T23:59:59.999Z');
    prisma.booking.findFirst.mockResolvedValue({
      contactRequestId: 'contact-1',
    });

    await expect(
      repository.findActiveBookingContactRequestId({
        guestEmail: 'guest@example.com',
        dayStart,
        dayEnd,
      }),
    ).resolves.toEqual({ contactRequestId: 'contact-1' });
    expect(prisma.booking.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          guestEmail: 'guest@example.com',
          eventDate: { gte: dayStart, lte: dayEnd },
        }) as Record<string, unknown>,
      }),
    );
  });

  it('findRecentContactByEmailAndEventDate delegates to contactRequest.findFirst', async () => {
    const row = makeContactRequestRow();
    const eventDate = new Date('2026-09-01T18:00:00.000Z');
    const since = new Date('2026-08-01T00:00:00.000Z');
    prisma.contactRequest.findFirst.mockResolvedValue(row);

    await expect(
      repository.findRecentContactByEmailAndEventDate({
        email: row.email,
        eventDate,
        since,
      }),
    ).resolves.toEqual(row);
    expect(prisma.contactRequest.findFirst).toHaveBeenCalledWith({
      where: {
        email: row.email,
        eventDate,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('findActiveBookingIdByContactRequestId delegates to booking.findFirst', async () => {
    prisma.booking.findFirst.mockResolvedValue({ id: 'booking-1' });
    await expect(
      repository.findActiveBookingIdByContactRequestId('contact-1'),
    ).resolves.toEqual({ id: 'booking-1' });
    expect(prisma.booking.findFirst).toHaveBeenCalledWith({
      where: {
        contactRequestId: 'contact-1',
        status: { not: BookingStatus.CANCELLED },
      },
      select: { id: true },
    });
  });

  it('listGuidanceFeed returns rows from $queryRaw', async () => {
    const rows = [
      { origin: 'CONTACT', id: 'contact-1', created_at: new Date() },
    ];
    prisma.$queryRaw.mockResolvedValue(rows);
    await expect(repository.listGuidanceFeed(0, 20)).resolves.toEqual(rows);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('listPrivateClassesFeed returns rows from $queryRaw', async () => {
    const rows = [
      { origin: 'BOOKING_ADMIN', id: 'booking-1', created_at: new Date() },
    ];
    prisma.$queryRaw.mockResolvedValue(rows);
    await expect(repository.listPrivateClassesFeed(10, 5)).resolves.toEqual(
      rows,
    );
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('listBookingsLaneFeed returns unified rows from $queryRaw', async () => {
    const rows = [
      { origin: 'CONTACT', id: 'contact-2', created_at: new Date() },
      { origin: 'BOOKING_ADMIN', id: 'booking-2', created_at: new Date() },
    ];
    prisma.$queryRaw.mockResolvedValue(rows);
    await expect(repository.listBookingsLaneFeed(0, 10)).resolves.toEqual(rows);
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('countGuidanceFeed parses bigint total from $queryRaw', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 7n }]);
    await expect(repository.countGuidanceFeed()).resolves.toBe(7);
  });

  it('countPrivateClassesFeed parses bigint total from $queryRaw', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 2n }]);
    await expect(repository.countPrivateClassesFeed()).resolves.toBe(2);
  });

  it('countBookingsLaneOrphans parses bigint total from $queryRaw', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 4n }]);
    await expect(repository.countBookingsLaneOrphans()).resolves.toBe(4);
  });

  it('countBookingsLaneNonPrivate parses bigint total from $queryRaw', async () => {
    prisma.$queryRaw.mockResolvedValue([{ total: 9n }]);
    await expect(repository.countBookingsLaneNonPrivate()).resolves.toBe(9);
  });

  it('feed count methods default to zero when $queryRaw returns empty', async () => {
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(repository.countGuidanceFeed()).resolves.toBe(0);
    await expect(repository.countPrivateClassesFeed()).resolves.toBe(0);
    await expect(repository.countBookingsLaneOrphans()).resolves.toBe(0);
    await expect(repository.countBookingsLaneNonPrivate()).resolves.toBe(0);
  });
});
