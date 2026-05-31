import { ConflictException } from '@nestjs/common';
import { UpcomingClassEnrollmentStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

type PrismaLike = Pick<PrismaService, 'upcomingFixedEventEnrollment'>;
type PrismaTx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

export async function countBlockingFixedEventEnrollments(
  prisma: PrismaLike,
  eventId: string,
): Promise<number> {
  const now = new Date();
  return prisma.upcomingFixedEventEnrollment.count({
    where: {
      eventId,
      OR: [
        { status: UpcomingClassEnrollmentStatus.PAID },
        {
          status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
      ],
    },
  });
}

export async function countPaidFixedEventEnrollments(
  prisma: PrismaLike,
  eventId: string,
): Promise<number> {
  return prisma.upcomingFixedEventEnrollment.count({
    where: {
      eventId,
      status: UpcomingClassEnrollmentStatus.PAID,
    },
  });
}

export async function fixedTicketsRemaining(
  prisma: PrismaLike,
  eventId: string,
  capacity: number,
): Promise<number> {
  const blocking = await countBlockingFixedEventEnrollments(prisma, eventId);
  return Math.max(0, capacity - blocking);
}

export async function assignFixedEventTicketNumber(
  tx: PrismaTx,
  eventId: string,
  enrollmentId: string,
  capacity: number | null,
): Promise<number> {
  const agg = await tx.upcomingFixedEventEnrollment.aggregate({
    where: { eventId, ticketNumber: { not: null } },
    _max: { ticketNumber: true },
  });
  const nextNumber = (agg._max.ticketNumber ?? 0) + 1;
  if (capacity != null && nextNumber > capacity) {
    throw new ConflictException('Tickets sold out.');
  }
  await tx.upcomingFixedEventEnrollment.update({
    where: { id: enrollmentId },
    data: { ticketNumber: nextNumber },
  });
  return nextNumber;
}

export function fixedEventStartsAtIso(
  reservationEventDate: Date | null | undefined,
): string | null {
  if (!reservationEventDate) return null;
  return reservationEventDate.toISOString();
}

export function normalizeFixedTicketCapacity(
  value: number | null | undefined,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}

export async function fixedTicketPublicStats(
  prisma: PrismaLike,
  eventId: string,
  capacityFromDb: number,
) {
  const fixedTicketCapacity = capacityFromDb;
  const ticketsRemaining = await fixedTicketsRemaining(
    prisma,
    eventId,
    fixedTicketCapacity,
  );
  const ticketsSold = await countPaidFixedEventEnrollments(prisma, eventId);
  return { fixedTicketCapacity, ticketsRemaining, ticketsSold };
}
