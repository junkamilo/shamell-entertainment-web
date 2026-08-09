import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type {
  ActiveLayoutRow,
  StandaloneChairConfigRow,
  StandaloneChairRow,
} from '../types/standalone-chairs.types';
import type { TechnicalChairNameEntry } from '../utils/standalone-chair-names.util';
import {
  collectPlacedStandaloneChairIds,
  parseLayoutItems,
} from '../utils/standalone-chairs-mapper.util';
import { findPaidStandaloneChairReservations } from '../utils/standalone-chairs-reservation.util';
import type { PlacedLayoutItem } from '../../floor-layout/types/floor-layout.types';

@Injectable()
export class StandaloneChairsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findActiveConfig(): Promise<StandaloneChairConfigRow | null> {
    return this.prisma.venueStandaloneChairConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  countActiveChairs(): Promise<number> {
    return this.prisma.venueStandaloneChair.count({
      where: { isActive: true },
    });
  }

  findActiveChairsPublic(): Promise<
    Array<{
      id: string;
      unitPrice: Prisma.Decimal | number;
      chairName: string;
      sortOrder: number;
    }>
  > {
    return this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, unitPrice: true, chairName: true, sortOrder: true },
    });
  }

  findActiveChairs(): Promise<StandaloneChairRow[]> {
    return this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  findActiveChairsDesc(): Promise<StandaloneChairRow[]> {
    return this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findActiveChairById(id: string): Promise<StandaloneChairRow | null> {
    return this.prisma.venueStandaloneChair.findFirst({
      where: { id, isActive: true },
    });
  }

  findActiveChairIds(): Promise<Array<{ id: string }>> {
    return this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      select: { id: true },
    });
  }

  findFirstActiveChair(): Promise<StandaloneChairRow | null> {
    return this.prisma.venueStandaloneChair.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async maxSortOrder(): Promise<number> {
    const agg = await this.prisma.venueStandaloneChair.aggregate({
      _max: { sortOrder: true },
    });
    return agg._max.sortOrder ?? -1;
  }

  async createChairsFromEntries(
    entries: TechnicalChairNameEntry[],
    unitPrice: number,
    baseSortOrder: number,
  ): Promise<void> {
    let sortOrder = baseSortOrder;
    await this.prisma.$transaction(async (tx) => {
      for (const entry of entries) {
        await tx.venueStandaloneChair.create({
          data: {
            id: entry.id,
            chairName: entry.chairName,
            unitPrice,
            isActive: true,
            sortOrder: sortOrder++,
          },
        });
      }
    });
  }

  async updateChairUnitPrice(id: string, unitPrice: number): Promise<void> {
    await this.prisma.venueStandaloneChair.update({
      where: { id },
      data: { unitPrice },
    });
  }

  async updateAllActiveUnitPrices(unitPrice: number): Promise<void> {
    await this.prisma.venueStandaloneChair.updateMany({
      where: { isActive: true },
      data: { unitPrice },
    });
  }

  async deleteChair(id: string): Promise<void> {
    await this.prisma.venueStandaloneChair.delete({ where: { id } });
  }

  async deleteChairsByIds(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.venueStandaloneChair.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async updateConfigQuantity(
    id: string,
    availableQuantity: number,
    unitPrice?: number,
  ): Promise<void> {
    await this.prisma.venueStandaloneChairConfig.update({
      where: { id },
      data: {
        availableQuantity,
        ...(unitPrice !== undefined ? { unitPrice } : {}),
      },
    });
  }

  async createConfig(
    availableQuantity: number,
    unitPrice: number,
  ): Promise<void> {
    await this.prisma.venueStandaloneChairConfig.create({
      data: {
        availableQuantity,
        unitPrice,
        isActive: true,
      },
    });
  }

  findActiveLayout(): Promise<ActiveLayoutRow | null> {
    return this.prisma.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, items: true },
    });
  }

  findPaidStandaloneChairReservations() {
    return findPaidStandaloneChairReservations(this.prisma);
  }

  async getPlacedStandaloneChairIds(): Promise<Set<string>> {
    const layout = await this.findActiveLayout();
    if (!layout) return new Set();
    return collectPlacedStandaloneChairIds(layout.items);
  }

  async getActiveLayoutItems(): Promise<PlacedLayoutItem[]> {
    const layout = await this.findActiveLayout();
    return layout ? parseLayoutItems(layout.items) : [];
  }

  async cleanupDeletedChairReferencesFromLayout(
    deletedChairIds: string[],
  ): Promise<void> {
    const layout = await this.findActiveLayout();
    if (!layout) return;

    const items = parseLayoutItems(layout.items);
    const nextItems = items.filter(
      (item) =>
        !(
          item.kind === 'standalone_chair' &&
          deletedChairIds.includes(item.venueStandaloneChairId)
        ),
    );
    if (nextItems.length === items.length) return;

    await this.prisma.venueFloorLayout.update({
      where: { id: layout.id },
      data: { items: nextItems },
    });
  }
}
