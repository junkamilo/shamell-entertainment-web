import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PlacedLayoutItem } from '../floor-layout/floor-layout.defaults';
import { PrismaService } from '../../prisma/prisma.service';
import { UpsertStandaloneChairConfigDto } from './dto/upsert-standalone-chair-config.dto';
import {
  generateTechnicalChairNameEntries,
  STANDALONE_CHAIR_DISPLAY_LABEL,
} from './standalone-chair-names.util';

@Injectable()
export class StandaloneChairsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicStandaloneChairs() {
    const row = await this.findActiveConfigRow();
    let activeCount = await this.countActiveChairs();
    if (row && row.availableQuantity > 0 && activeCount === 0) {
      await this.materializeChairsFromLegacyConfig(row);
      activeCount = await this.countActiveChairs();
    }
    const unitPrice = await this.resolveUnitPrice(row, activeCount);
    return {
      id: row?.id ?? null,
      availableQuantity: activeCount,
      unitPrice,
      updatedAt: row?.updatedAt ?? null,
      isDefault: !row && activeCount === 0,
    };
  }

  async getAdminStandaloneChairs() {
    const row = await this.findActiveConfigRow();
    let chairCount = await this.countActiveChairs();
    if (row && row.availableQuantity > 0 && chairCount === 0) {
      await this.materializeChairsFromLegacyConfig(row);
      chairCount = await this.countActiveChairs();
    }

    const chairs = await this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const activeCount = chairs.length;
    const unitPrice = await this.resolveUnitPrice(row, activeCount, chairs);

    return {
      id: row?.id ?? null,
      availableQuantity: activeCount,
      unitPrice,
      updatedAt: row?.updatedAt ?? chairs[0]?.updatedAt ?? null,
      isDefault: !row && activeCount === 0,
      chairs: chairs.map((chair) => this.mapChairRow(chair)),
    };
  }

  async upsertAdminStandaloneChairs(dto: UpsertStandaloneChairConfigDto) {
    const targetQuantity = Math.round(dto.availableQuantity);
    const unitPrice = dto.unitPrice;

    const placedChairIds = await this.getPlacedStandaloneChairIds();
    const activeChairs = await this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'desc' }, { createdAt: 'desc' }],
    });

    if (targetQuantity > activeChairs.length) {
      const toCreate = targetQuantity - activeChairs.length;
      const agg = await this.prisma.venueStandaloneChair.aggregate({
        _max: { sortOrder: true },
      });
      let baseSort = (agg._max.sortOrder ?? -1) + 1;
      const entries = generateTechnicalChairNameEntries(toCreate);

      await this.prisma.$transaction(
        entries.map((entry) =>
          this.prisma.venueStandaloneChair.create({
            data: {
              id: entry.id,
              chairName: entry.chairName,
              unitPrice,
              isActive: true,
              sortOrder: baseSort++,
            },
          }),
        ),
      );
    } else if (targetQuantity < activeChairs.length) {
      const toRemove = activeChairs.length - targetQuantity;
      const removable = activeChairs.filter((c) => !placedChairIds.has(c.id));
      if (removable.length < toRemove) {
        throw new BadRequestException(
          `Cannot reduce quantity: ${toRemove - removable.length} chair(s) are on the On Coming Events floor plan. Remove them from the floor plan first.`,
        );
      }
      const idsToDelete = removable.slice(0, toRemove).map((c) => c.id);
      await this.cleanupDeletedChairReferencesFromLayout(idsToDelete);
      await this.prisma.venueStandaloneChair.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    if (targetQuantity > 0) {
      await this.prisma.venueStandaloneChair.updateMany({
        where: { isActive: true },
        data: { unitPrice },
      });
    }

    const existing = await this.findActiveConfigRow();
    if (existing) {
      await this.prisma.venueStandaloneChairConfig.update({
        where: { id: existing.id },
        data: {
          availableQuantity: targetQuantity,
          unitPrice,
        },
      });
    } else if (targetQuantity > 0) {
      await this.prisma.venueStandaloneChairConfig.create({
        data: {
          availableQuantity: targetQuantity,
          unitPrice,
          isActive: true,
        },
      });
    }

    return this.getAdminStandaloneChairs();
  }

  private async countActiveChairs(): Promise<number> {
    return this.prisma.venueStandaloneChair.count({
      where: { isActive: true },
    });
  }

  private async resolveUnitPrice(
    config: { unitPrice: Prisma.Decimal | number } | null,
    activeCount: number,
    chairs?: { unitPrice: Prisma.Decimal | number }[],
  ): Promise<number> {
    if (config) return this.decimalToNumber(config.unitPrice);
    if (chairs && chairs.length > 0) {
      return this.decimalToNumber(chairs[0].unitPrice);
    }
    if (activeCount === 0) return 0;
    const first = await this.prisma.venueStandaloneChair.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return first ? this.decimalToNumber(first.unitPrice) : 0;
  }

  private mapChairRow(row: {
    id: string;
    chairName: string;
    unitPrice: Prisma.Decimal | number;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      chairName: row.chairName,
      displayLabel: STANDALONE_CHAIR_DISPLAY_LABEL,
      unitPrice: this.decimalToNumber(row.unitPrice),
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async materializeChairsFromLegacyConfig(row: {
    availableQuantity: number;
    unitPrice: Prisma.Decimal | number;
  }) {
    const quantity = Math.round(row.availableQuantity);
    if (quantity <= 0) return;

    const entries = generateTechnicalChairNameEntries(quantity);
    const unitPrice = this.decimalToNumber(row.unitPrice);

    await this.prisma.$transaction(
      entries.map((entry, index) =>
        this.prisma.venueStandaloneChair.create({
          data: {
            id: entry.id,
            chairName: entry.chairName,
            unitPrice,
            isActive: true,
            sortOrder: index,
          },
        }),
      ),
    );
  }

  private async findActiveConfigRow() {
    return this.prisma.venueStandaloneChairConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async getPlacedStandaloneChairIds(): Promise<Set<string>> {
    const layout = await this.prisma.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!layout) return new Set();

    const ids = new Set<string>();
    const raw = layout.items;
    if (!Array.isArray(raw)) return ids;

    for (const candidate of raw) {
      if (!candidate || typeof candidate !== 'object') continue;
      const item = candidate as Record<string, unknown>;
      if (
        item.kind === 'standalone_chair' &&
        typeof item.venueStandaloneChairId === 'string'
      ) {
        ids.add(item.venueStandaloneChairId);
      }
    }
    return ids;
  }

  private async cleanupDeletedChairReferencesFromLayout(
    deletedChairIds: string[],
  ) {
    const layout = await this.prisma.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!layout) return;

    const items = this.parseLayoutItems(layout.items);
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
      data: { items: nextItems as unknown as Prisma.JsonArray },
    });
  }

  private parseLayoutItems(raw: Prisma.JsonValue): PlacedLayoutItem[] {
    if (!Array.isArray(raw)) return [];
    const output: PlacedLayoutItem[] = [];
    for (const candidate of raw) {
      if (!candidate || typeof candidate !== 'object') continue;
      const item = candidate as Record<string, unknown>;
      if (
        item.kind === 'standalone_chair' &&
        typeof item.id === 'string' &&
        typeof item.venueStandaloneChairId === 'string' &&
        typeof item.x === 'number' &&
        typeof item.y === 'number' &&
        typeof item.rotation === 'number'
      ) {
        output.push({
          id: item.id,
          kind: 'standalone_chair',
          venueStandaloneChairId: item.venueStandaloneChairId,
          chairName:
            typeof item.chairName === 'string'
              ? item.chairName
              : STANDALONE_CHAIR_DISPLAY_LABEL,
          x: item.x,
          y: item.y,
          rotation: item.rotation,
        });
      }
    }
    return output;
  }

  private decimalToNumber(value: Prisma.Decimal | number): number {
    return typeof value === 'number' ? value : Number(value.toString());
  }
}
