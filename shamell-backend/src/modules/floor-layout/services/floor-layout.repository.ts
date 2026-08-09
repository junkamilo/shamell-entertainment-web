import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { FLOOR_LAYOUT_UPSERT_TX_TIMEOUT_MS } from '../constants/floor-layout.constants';
import type {
  FloorLayoutRow,
  PlacedLayoutItem,
  VenueTableSizeLabel,
} from '../types/floor-layout.types';

export type FloorLayoutUpsertData = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: Prisma.InputJsonValue;
  sceneZones: Prisma.InputJsonValue;
};

export type VenueTableConfigRow = {
  id: string;
  tableName: string;
  size: VenueTableSizeLabel;
  includedChairs: number;
  sortOrder: number;
  isActive?: boolean;
};

export type VenueStandaloneChairRow = {
  id: string;
  chairName: string;
  unitPrice: Prisma.Decimal | number;
  sortOrder: number;
  isActive?: boolean;
};

@Injectable()
export class FloorLayoutRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveLayout(): Promise<FloorLayoutRow | null> {
    return this.prisma.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findLayoutById(id: string): Promise<FloorLayoutRow | null> {
    return this.prisma.venueFloorLayout.findUnique({
      where: { id },
    });
  }

  findClientSettings() {
    return this.prisma.venueLayoutClientSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  countClientEnabledUpcomingConfigs(): Promise<number> {
    return this.prisma.upcomingVenueConfig.count({
      where: { clientEnabled: true },
    });
  }

  findActiveTablesForPalette(): Promise<VenueTableConfigRow[]> {
    return this.prisma.venueTableConfig.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { tableName: 'asc' }],
      select: {
        id: true,
        tableName: true,
        size: true,
        includedChairs: true,
        sortOrder: true,
      },
    });
  }

  findActiveChairsForPalette(): Promise<VenueStandaloneChairRow[]> {
    return this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        chairName: true,
        unitPrice: true,
        sortOrder: true,
      },
    });
  }

  findAllActiveTables(): Promise<VenueTableConfigRow[]> {
    return this.prisma.venueTableConfig.findMany({
      where: { isActive: true },
    });
  }

  findAllActiveStandaloneChairs(): Promise<VenueStandaloneChairRow[]> {
    return this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
    });
  }

  findActiveStandaloneChairsByIds(
    ids: string[],
  ): Promise<Pick<VenueStandaloneChairRow, 'id' | 'unitPrice'>[]> {
    return this.prisma.venueStandaloneChair.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, unitPrice: true },
    });
  }

  updateLayoutItems(
    id: string,
    items: Prisma.JsonArray,
  ): Promise<FloorLayoutRow> {
    return this.prisma.venueFloorLayout.update({
      where: { id },
      data: { items },
    });
  }

  /**
   * Persist layout (create or update), sync table visual coords, backfill
   * upcomingVenueConfig.floorLayoutId when null.
   */
  upsertLayoutWithSideEffects(params: {
    existingId: string | null;
    data: FloorLayoutUpsertData;
    items: PlacedLayoutItem[];
  }): Promise<FloorLayoutRow> {
    const { existingId, data, items } = params;
    return this.prisma.$transaction(
      async (tx) => {
        const saved = existingId
          ? await tx.venueFloorLayout.update({
              where: { id: existingId },
              data,
            })
          : await tx.venueFloorLayout.create({
              data: {
                ...data,
                isActive: true,
              },
            });

        await this.syncTableVisualCoordinates(tx, items);

        await tx.upcomingVenueConfig.updateMany({
          where: { floorLayoutId: null },
          data: { floorLayoutId: saved.id },
        });

        return saved;
      },
      { timeout: FLOOR_LAYOUT_UPSERT_TX_TIMEOUT_MS },
    );
  }

  private async syncTableVisualCoordinates(
    tx: Prisma.TransactionClient,
    items: PlacedLayoutItem[],
  ) {
    const placedTables = items.filter(
      (i): i is Extract<PlacedLayoutItem, { kind: 'catalog_table' }> =>
        i.kind === 'catalog_table',
    );
    const placedIds = placedTables.map((i) => i.venueTableConfigId);

    if (placedTables.length > 0) {
      await Promise.all(
        placedTables.map((item) =>
          tx.venueTableConfig.update({
            where: { id: item.venueTableConfigId },
            data: { visualX: item.x, visualY: item.y },
          }),
        ),
      );
    }

    await tx.venueTableConfig.updateMany({
      where: {
        isActive: true,
        ...(placedIds.length > 0 ? { id: { notIn: placedIds } } : {}),
      },
      data: { visualX: null, visualY: null },
    });
  }
}
