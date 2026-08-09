import { Injectable } from '@nestjs/common';
import { Prisma, VenueTableSize } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import type { TechnicalTableNameEntry } from '../types/venue-tables.types';
import { parseLayoutItems } from '../utils/venue-tables-mapper.util';

@Injectable()
export class VenueTablesRepository {
  constructor(private readonly prisma: PrismaService) {}

  asPrisma(): PrismaService {
    return this.prisma;
  }

  runTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.prisma.$transaction(fn, options);
  }

  findActiveTables() {
    return this.prisma.venueTableConfig.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { tableName: 'asc' }],
    });
  }

  findAllTables() {
    return this.prisma.venueTableConfig.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  findById(id: string) {
    return this.prisma.venueTableConfig.findUnique({ where: { id } });
  }

  findAllTableNames() {
    return this.prisma.venueTableConfig.findMany({
      select: { tableName: true },
    });
  }

  async maxSortOrder(): Promise<number> {
    const agg = await this.prisma.venueTableConfig.aggregate({
      _max: { sortOrder: true },
    });
    return agg._max.sortOrder ?? -1;
  }

  create(data: Prisma.VenueTableConfigUncheckedCreateInput) {
    return this.prisma.venueTableConfig.create({ data });
  }

  update(id: string, data: Prisma.VenueTableConfigUncheckedUpdateInput) {
    return this.prisma.venueTableConfig.update({ where: { id }, data });
  }

  updateManyActiveBySize(size: VenueTableSize, bundlePrice: number) {
    return this.prisma.venueTableConfig.updateMany({
      where: { isActive: true, size },
      data: { bundlePrice },
    });
  }

  createManyFromEntries(
    entries: TechnicalTableNameEntry[],
    data: {
      size: VenueTableSize;
      includedChairs: number;
      bundlePrice: number;
      baseSortOrder: number;
    },
  ) {
    return this.prisma.$transaction(
      entries.map((entry, index) =>
        this.prisma.venueTableConfig.create({
          data: {
            id: entry.id,
            tableName: entry.tableName,
            size: data.size,
            includedChairs: data.includedChairs,
            bundlePrice: data.bundlePrice,
            isActive: true,
            sortOrder: data.baseSortOrder + index,
          },
        }),
      ),
    );
  }

  bulkDeleteActiveTables(scope: {
    size?: VenueTableSize;
  }): Promise<{ size: VenueTableSize | null; deletedCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const targets = await tx.venueTableConfig.findMany({
        where: {
          isActive: true,
          ...(scope.size ? { size: scope.size } : {}),
        },
        select: { id: true },
      });

      if (targets.length === 0) {
        return {
          size: scope.size ?? null,
          deletedCount: 0,
        };
      }

      const ids = targets.map((t) => t.id);
      await this.cleanupDeletedTableReferencesFromLayout(tx, ids);

      const deleted = await tx.venueTableConfig.deleteMany({
        where: { id: { in: ids } },
      });

      return {
        size: scope.size ?? null,
        deletedCount: deleted.count,
      };
    });
  }

  private async cleanupDeletedTableReferencesFromLayout(
    tx: Prisma.TransactionClient,
    deletedTableIds: string[],
  ) {
    const layout = await tx.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!layout) return;

    const items = parseLayoutItems(layout.items);
    const nextItems = items.filter(
      (item) =>
        !(
          item.kind === 'catalog_table' &&
          deletedTableIds.includes(item.venueTableConfigId)
        ),
    );
    if (nextItems.length === items.length) return;

    await tx.venueFloorLayout.update({
      where: { id: layout.id },
      data: { items: nextItems },
    });
  }
}
