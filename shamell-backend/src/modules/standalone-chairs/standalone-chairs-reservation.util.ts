import {
  Prisma,
  PrismaClient,
  VenueSeatKind,
  VenueSeatReservationStatus,
} from '@prisma/client';
import type { PlacedLayoutItem } from '../floor-layout/floor-layout.defaults';

export type BlockingStandaloneChairReservation = {
  layoutItemId: string;
  status: VenueSeatReservationStatus;
};

export type StandaloneChairReservationFlags = {
  isReserved: boolean;
  reservationStatus?: 'PAID' | 'PENDING_PAYMENT';
  isOnFloorPlan: boolean;
  canDelete: boolean;
  canEditPrice: boolean;
};

export function blockingReservationStatusWhere(
  now = new Date(),
): Prisma.VenueSeatReservationWhereInput {
  return {
    OR: [
      { status: VenueSeatReservationStatus.PAID },
      {
        status: VenueSeatReservationStatus.PENDING_PAYMENT,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    ],
  };
}

export function paidReservationStatusWhere(): Prisma.VenueSeatReservationWhereInput {
  return { status: VenueSeatReservationStatus.PAID };
}

export async function findBlockingStandaloneChairReservations(
  prisma: PrismaClient | Prisma.TransactionClient,
): Promise<BlockingStandaloneChairReservation[]> {
  const now = new Date();
  const rows = await prisma.venueSeatReservation.findMany({
    where: {
      kind: VenueSeatKind.STANDALONE_CHAIR,
      ...blockingReservationStatusWhere(now),
    },
    select: {
      layoutItemId: true,
      status: true,
    },
  });
  return rows;
}

export async function findPaidStandaloneChairReservations(
  prisma: PrismaClient | Prisma.TransactionClient,
): Promise<BlockingStandaloneChairReservation[]> {
  const rows = await prisma.venueSeatReservation.findMany({
    where: {
      kind: VenueSeatKind.STANDALONE_CHAIR,
      ...paidReservationStatusWhere(),
    },
    select: {
      layoutItemId: true,
      status: true,
    },
  });
  return rows;
}

export function buildChairPlacementMap(
  layoutItems: PlacedLayoutItem[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of layoutItems) {
    if (item.kind === 'standalone_chair') {
      map.set(item.venueStandaloneChairId, item.id);
    }
  }
  return map;
}

export function buildReservedLayoutItemMap(
  reservations: BlockingStandaloneChairReservation[],
): Map<string, VenueSeatReservationStatus> {
  const map = new Map<string, VenueSeatReservationStatus>();
  for (const row of reservations) {
    const existing = map.get(row.layoutItemId);
    if (!existing || row.status === VenueSeatReservationStatus.PAID) {
      map.set(row.layoutItemId, row.status);
    }
  }
  return map;
}

export function enrichChairWithReservationState(
  chairId: string,
  placementMap: Map<string, string>,
  reservedLayoutItems: Map<string, VenueSeatReservationStatus>,
): StandaloneChairReservationFlags {
  const layoutItemId = placementMap.get(chairId);
  const isOnFloorPlan = layoutItemId != null;
  const reservationStatus =
    layoutItemId != null ? reservedLayoutItems.get(layoutItemId) : undefined;
  const isReserved = reservationStatus === VenueSeatReservationStatus.PAID;

  return {
    isReserved,
    reservationStatus:
      reservationStatus === VenueSeatReservationStatus.PAID
        ? 'PAID'
        : undefined,
    isOnFloorPlan,
    canDelete: !isReserved,
    canEditPrice: !isReserved,
  };
}

export function enrichChairsWithReservationState<T extends { id: string }>(
  chairs: T[],
  placementMap: Map<string, string>,
  reservations: BlockingStandaloneChairReservation[],
): Array<T & StandaloneChairReservationFlags> {
  const reservedLayoutItems = buildReservedLayoutItemMap(reservations);
  return chairs.map((chair) => ({
    ...chair,
    ...enrichChairWithReservationState(
      chair.id,
      placementMap,
      reservedLayoutItems,
    ),
  }));
}
