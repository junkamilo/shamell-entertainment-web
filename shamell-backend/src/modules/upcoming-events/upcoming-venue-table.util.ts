import { VenueSeatReservationStatus } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';

type PrismaLike = Pick<PrismaService, 'venueFloorLayout' | 'venueSeatReservation'>;

function parseCatalogTableLayoutItemIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const ids: string[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { kind?: string; id?: string };
    if (row.kind !== 'catalog_table' || typeof row.id !== 'string' || !row.id) {
      continue;
    }
    ids.push(row.id);
  }
  return ids;
}

export async function loadCatalogTableLayoutItemIds(
  prisma: PrismaLike,
  floorLayoutId: string | null,
): Promise<string[]> {
  const row = floorLayoutId
    ? await prisma.venueFloorLayout.findUnique({
        where: { id: floorLayoutId },
        select: { items: true },
      })
    : await prisma.venueFloorLayout.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
        select: { items: true },
      });

  return parseCatalogTableLayoutItemIds(row?.items);
}

export async function venueTablePublicStats(
  prisma: PrismaLike,
  args: {
    eventId: string;
    eventDate: Date;
    floorLayoutId: string | null;
  },
): Promise<{ tableCapacity: number; tablesRemaining: number; tablesSold: number }> {
  const tableIds = await loadCatalogTableLayoutItemIds(
    prisma,
    args.floorLayoutId,
  );
  const tableCapacity = tableIds.length;
  if (tableCapacity === 0) {
    return { tableCapacity: 0, tablesRemaining: 0, tablesSold: 0 };
  }

  const paid = await prisma.venueSeatReservation.findMany({
    where: {
      upcomingEventId: args.eventId,
      eventDate: args.eventDate,
      layoutItemId: { in: tableIds },
      status: VenueSeatReservationStatus.PAID,
    },
    select: { layoutItemId: true },
  });

  const paidIds = new Set(paid.map((row) => row.layoutItemId));
  const tablesRemaining = tableIds.filter((id) => !paidIds.has(id)).length;
  const tablesSold = paid.length;

  return { tableCapacity, tablesRemaining, tablesSold };
}
