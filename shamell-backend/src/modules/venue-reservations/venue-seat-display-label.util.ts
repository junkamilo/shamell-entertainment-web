import {
  VenueSeatKind,
  VenueTableSize,
  type PrismaClient,
} from '@prisma/client';
import { formatVenueTableSizeLabel } from '../venue-tables/venue-table-names.util';

const TECHNICAL_TABLE_NAME = /^(LARGE|MEDIUM|SMALL)-[a-f0-9]{8}$/i;
const TECHNICAL_CHAIR_NAME = /^CHAIR-[a-f0-9]{8}$/i;

export function isTechnicalTableName(name: string): boolean {
  return TECHNICAL_TABLE_NAME.test(name.trim());
}

export function isTechnicalChairName(name: string): boolean {
  return TECHNICAL_CHAIR_NAME.test(name.trim());
}

export function formatTableDisplayLabel(
  size: VenueTableSize,
  ordinal: number,
): string {
  return `${formatVenueTableSizeLabel(size)} table ${ordinal}`;
}

export function formatChairDisplayLabel(ordinal: number): string {
  return `Chair ${ordinal}`;
}

/** Short label for 3D bubbles: "Large table 4" → "Large 4". */
export function toShortSeatDisplayLabel(full: string): string {
  return full.replace(/\s+table\s+/i, ' ').trim();
}

function ordinalFromOrderedIds(
  orderedIds: readonly string[],
  targetId: string,
): number {
  const index = orderedIds.indexOf(targetId);
  return index >= 0 ? index + 1 : 1;
}

type PrismaLike = Pick<
  PrismaClient,
  'venueTableConfig' | 'venueStandaloneChair'
>;

type FloorLayoutReader = {
  getPublicFloorLayoutForClient: (floorLayoutId?: string | null) => Promise<{
    items: Array<{
      id: string;
      kind: string;
      venueTableConfigId?: string;
      venueStandaloneChairId?: string;
      tableName?: string;
      chairName?: string;
    }>;
  }>;
};

export type ResolveVenueSeatDisplayLabelArgs = {
  kind: VenueSeatKind;
  layoutItemId: string;
  venueTableConfigId: string | null;
  floorLayoutId?: string | null;
  venueTableConfig?: {
    id: string;
    tableName: string;
    size: VenueTableSize;
    sortOrder?: number;
  } | null;
  venueStandaloneChairId?: string | null;
};

export async function resolveVenueSeatDisplayLabel(
  prisma: PrismaLike,
  floorLayout: FloorLayoutReader,
  args: ResolveVenueSeatDisplayLabelArgs,
): Promise<string> {
  if (args.kind === VenueSeatKind.CATALOG_TABLE) {
    return resolveTableDisplayLabel(prisma, args);
  }
  return resolveChairDisplayLabel(prisma, floorLayout, args);
}

async function resolveTableDisplayLabel(
  prisma: PrismaLike,
  args: ResolveVenueSeatDisplayLabelArgs,
): Promise<string> {
  const tableId = args.venueTableConfigId;
  if (!tableId) return 'Reserved table';

  const table =
    args.venueTableConfig?.id === tableId
      ? args.venueTableConfig
      : await prisma.venueTableConfig.findFirst({
          where: { id: tableId, isActive: true },
          select: {
            id: true,
            tableName: true,
            size: true,
            sortOrder: true,
          },
        });

  if (!table) return 'Reserved table';

  const customName = table.tableName?.trim();
  if (customName && !isTechnicalTableName(customName)) {
    return customName;
  }

  const peers = await prisma.venueTableConfig.findMany({
    where: { isActive: true, size: table.size },
    orderBy: [{ sortOrder: 'asc' }, { tableName: 'asc' }],
    select: { id: true },
  });
  const ordinal = ordinalFromOrderedIds(
    peers.map((row) => row.id),
    table.id,
  );
  return formatTableDisplayLabel(table.size, ordinal);
}

async function resolveChairDisplayLabel(
  prisma: PrismaLike,
  floorLayout: FloorLayoutReader,
  args: ResolveVenueSeatDisplayLabelArgs,
): Promise<string> {
  let chairId = args.venueStandaloneChairId ?? null;

  if (!chairId) {
    try {
      const layout = await floorLayout.getPublicFloorLayoutForClient(
        args.floorLayoutId,
      );
      const layoutItem = layout.items.find(
        (item) => item.id === args.layoutItemId,
      );
      if (layoutItem?.kind === 'standalone_chair') {
        chairId = layoutItem.venueStandaloneChairId ?? null;
      }
    } catch {
      // Floor plan unavailable — fall back below.
    }
  }

  if (!chairId) return 'Reserved chair';

  const chair = await prisma.venueStandaloneChair.findFirst({
    where: { id: chairId, isActive: true },
    select: { id: true, chairName: true, sortOrder: true },
  });
  if (!chair) return 'Reserved chair';

  const customName = chair.chairName?.trim();
  if (customName && !isTechnicalChairName(customName)) {
    return customName;
  }

  const peers = await prisma.venueStandaloneChair.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { chairName: 'asc' }],
    select: { id: true },
  });
  const ordinal = ordinalFromOrderedIds(
    peers.map((row) => row.id),
    chair.id,
  );
  return formatChairDisplayLabel(ordinal);
}
