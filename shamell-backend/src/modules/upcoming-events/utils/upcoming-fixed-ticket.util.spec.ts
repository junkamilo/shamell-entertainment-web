import { ConflictException } from '@nestjs/common';
import { UpcomingClassEnrollmentStatus } from '@prisma/client';
import {
  assignFixedEventTicketNumber,
  countBlockingFixedEventEnrollments,
  countPaidFixedEventEnrollments,
  fixedEventStartsAtIso,
  fixedTicketPublicStats,
  fixedTicketsRemaining,
  normalizeFixedTicketCapacity,
} from './upcoming-fixed-ticket.util';

describe('upcoming-fixed-ticket.util', () => {
  it('normalizeFixedTicketCapacity handles edges', () => {
    expect(normalizeFixedTicketCapacity(undefined)).toBeUndefined();
    expect(normalizeFixedTicketCapacity(null)).toBeNull();
    expect(normalizeFixedTicketCapacity(0)).toBeNull();
    expect(normalizeFixedTicketCapacity(10.9)).toBe(10);
  });

  it('fixedEventStartsAtIso returns ISO or null', () => {
    expect(fixedEventStartsAtIso(null)).toBeNull();
    const d = new Date('2026-08-01T20:00:00.000Z');
    expect(fixedEventStartsAtIso(d)).toBe(d.toISOString());
  });

  it('counts blocking and paid enrollments', async () => {
    const prisma = {
      upcomingFixedEventEnrollment: {
        count: jest.fn().mockResolvedValue(3),
      },
    };
    await expect(
      countBlockingFixedEventEnrollments(prisma, 'evt-1'),
    ).resolves.toBe(3);
    const blockingCalls = prisma.upcomingFixedEventEnrollment.count.mock
      .calls as unknown as Array<[{ where: { eventId: string } }]>;
    expect(blockingCalls[0]?.[0]?.where.eventId).toBe('evt-1');

    prisma.upcomingFixedEventEnrollment.count.mockResolvedValue(2);
    await expect(countPaidFixedEventEnrollments(prisma, 'evt-1')).resolves.toBe(
      2,
    );
    expect(prisma.upcomingFixedEventEnrollment.count).toHaveBeenCalledWith({
      where: {
        eventId: 'evt-1',
        status: UpcomingClassEnrollmentStatus.PAID,
      },
    });
  });

  it('fixedTicketsRemaining subtracts blocking from capacity', async () => {
    const prisma = {
      upcomingFixedEventEnrollment: {
        count: jest.fn().mockResolvedValue(4),
      },
    };
    await expect(fixedTicketsRemaining(prisma, 'evt-1', 10)).resolves.toBe(6);
  });

  it('assignFixedEventTicketNumber assigns next and rejects sold out', async () => {
    const tx = {
      upcomingFixedEventEnrollment: {
        aggregate: jest.fn().mockResolvedValue({ _max: { ticketNumber: 2 } }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    await expect(
      assignFixedEventTicketNumber(tx as never, 'evt-1', 'enr-1', 10),
    ).resolves.toBe(3);
    expect(tx.upcomingFixedEventEnrollment.update).toHaveBeenCalledWith({
      where: { id: 'enr-1' },
      data: { ticketNumber: 3 },
    });

    tx.upcomingFixedEventEnrollment.aggregate.mockResolvedValue({
      _max: { ticketNumber: 5 },
    });
    await expect(
      assignFixedEventTicketNumber(tx as never, 'evt-1', 'enr-2', 5),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('fixedTicketPublicStats aggregates capacity remaining and sold', async () => {
    const prisma = {
      upcomingFixedEventEnrollment: {
        count: jest.fn().mockResolvedValueOnce(3).mockResolvedValueOnce(2),
      },
    };
    await expect(fixedTicketPublicStats(prisma, 'evt-1', 10)).resolves.toEqual({
      fixedTicketCapacity: 10,
      ticketsRemaining: 7,
      ticketsSold: 2,
    });
  });
});
