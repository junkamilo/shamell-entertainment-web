import { ConflictException } from '@nestjs/common';
import { FixedTicketMode, UpcomingClassEnrollmentStatus } from '@prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';

type PrismaLike = Pick<
  PrismaService,
  'upcomingFixedEventEnrollment' | 'upcomingFixedEventPackage'
>;
type PrismaTx = Parameters<Parameters<PrismaService['$transaction']>[0]>[0];

export type FixedTicketInventorySlice = {
  capacity: number;
  blocking: number;
  remaining: number;
  sold: number;
};

export type FixedTicketInventoryResult = {
  mode: FixedTicketMode;
  total: FixedTicketInventorySlice;
  byPackage: Map<string, FixedTicketInventorySlice>;
};

const blockingWhere = (now: Date) => ({
  OR: [
    { status: UpcomingClassEnrollmentStatus.PAID },
    {
      status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  ],
});

export async function countBlockingFixedEventEnrollments(
  prisma: PrismaLike,
  eventId: string,
): Promise<number> {
  const now = new Date();
  return prisma.upcomingFixedEventEnrollment.count({
    where: {
      eventId,
      ...blockingWhere(now),
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

export async function getFixedTicketInventory(
  prisma: PrismaLike,
  eventId: string,
  config: {
    fixedTicketMode: FixedTicketMode;
    fixedTicketCapacity: number | null;
  },
): Promise<FixedTicketInventoryResult> {
  const now = new Date();

  if (config.fixedTicketMode === FixedTicketMode.SINGLE) {
    const capacity = config.fixedTicketCapacity ?? 0;
    const blocking = await countBlockingFixedEventEnrollments(prisma, eventId);
    const sold = await countPaidFixedEventEnrollments(prisma, eventId);
    const remaining = Math.max(0, capacity - blocking);
    return {
      mode: FixedTicketMode.SINGLE,
      total: { capacity, blocking, remaining, sold },
      byPackage: new Map(),
    };
  }

  const packages = await prisma.upcomingFixedEventPackage.findMany({
    where: { eventId, isActive: true },
    select: { id: true, capacity: true },
  });
  const packageIds = packages.map((p) => p.id);

  const [blockingRows, soldRows] = await Promise.all([
    packageIds.length > 0
      ? prisma.upcomingFixedEventEnrollment.groupBy({
          by: ['packageId'],
          where: {
            eventId,
            packageId: { in: packageIds },
            ...blockingWhere(now),
          },
          _count: { _all: true },
        })
      : Promise.resolve(
          [] as { packageId: string | null; _count: { _all: number } }[],
        ),
    packageIds.length > 0
      ? prisma.upcomingFixedEventEnrollment.groupBy({
          by: ['packageId'],
          where: {
            eventId,
            packageId: { in: packageIds },
            status: UpcomingClassEnrollmentStatus.PAID,
          },
          _count: { _all: true },
        })
      : Promise.resolve(
          [] as { packageId: string | null; _count: { _all: number } }[],
        ),
  ]);

  const blockingByPackage = new Map(
    blockingRows
      .filter((r) => r.packageId)
      .map((r) => [r.packageId!, r._count._all] as const),
  );
  const soldByPackage = new Map(
    soldRows
      .filter((r) => r.packageId)
      .map((r) => [r.packageId!, r._count._all] as const),
  );

  const byPackage = new Map<string, FixedTicketInventorySlice>();
  let totalCapacity = 0;
  let totalBlocking = 0;
  let totalSold = 0;

  for (const pkg of packages) {
    const blocking = blockingByPackage.get(pkg.id) ?? 0;
    const sold = soldByPackage.get(pkg.id) ?? 0;
    const remaining = Math.max(0, pkg.capacity - blocking);
    byPackage.set(pkg.id, {
      capacity: pkg.capacity,
      blocking,
      remaining,
      sold,
    });
    totalCapacity += pkg.capacity;
    totalBlocking += blocking;
    totalSold += sold;
  }

  return {
    mode: FixedTicketMode.PACKAGES,
    total: {
      capacity: totalCapacity,
      blocking: totalBlocking,
      remaining: Math.max(0, totalCapacity - totalBlocking),
      sold: totalSold,
    },
    byPackage,
  };
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

export async function countBlockingEnrollmentsForPackage(
  tx: PrismaTx,
  packageId: string,
): Promise<number> {
  const now = new Date();
  return tx.upcomingFixedEventEnrollment.count({
    where: {
      packageId,
      ...blockingWhere(now),
    },
  });
}
