import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, VenueTableConfig, VenueTableSize } from '@prisma/client';
import { PlacedLayoutItem } from '../floor-layout/floor-layout.defaults';
import { FloorLayoutService } from '../floor-layout/floor-layout.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CHAIR_LIMITS,
  clampChairsForSize,
} from './venue-tables.constants';
import { BulkCreateVenueTableConfigDto } from './dto/bulk-create-venue-table-config.dto';
import {
  BulkDeleteVenueTableConfigDto,
  VenueTableBulkDeleteScope,
} from './dto/bulk-delete-venue-table-config.dto';
import { CreateVenueTableConfigDto } from './dto/create-venue-table-config.dto';
import { UpdateVenueTableConfigDto } from './dto/update-venue-table-config.dto';
import { randomUUID } from 'crypto';
import {
  buildTechnicalTableName,
  findNameConflict,
  formatVenueTableSizeLabel,
  generateTechnicalTableNameEntries,
} from './venue-table-names.util';

@Injectable()
export class VenueTablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly floorLayoutService: FloorLayoutService,
  ) {}

  async getPublicVenueTables() {
    const rows = await this.prisma.venueTableConfig.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { tableName: 'asc' }],
    });
    return rows.map((row) => this.mapRow(row));
  }

  async getAdminVenueTables() {
    const rows = await this.prisma.venueTableConfig.findMany({
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
    return rows.map((row) => this.mapRow(row));
  }

  async getAdminVenueTableById(id: string) {
    const row = await this.findById(id);
    return this.mapRow(row);
  }

  async createAdminVenueTable(dto: CreateVenueTableConfigDto) {
    const includedChairs = this.resolveChairs(dto.size, dto.includedChairs);
    const id = randomUUID();
    const tableName =
      dto.tableName?.trim() || buildTechnicalTableName(dto.size, id);

    const created = await this.prisma.venueTableConfig.create({
      data: {
        id,
        tableName,
        size: dto.size,
        includedChairs,
        bundlePrice: dto.bundlePrice,
        visualX: dto.visualX ?? null,
        visualY: dto.visualY ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return this.mapRow(created);
  }

  async bulkCreateAdminVenueTables(dto: BulkCreateVenueTableConfigDto) {
    const includedChairs = this.resolveChairs(dto.size, dto.includedChairs);
    const entries = generateTechnicalTableNameEntries(dto.size, dto.quantity);

    const existingRows = await this.prisma.venueTableConfig.findMany({
      select: { tableName: true },
    });
    const existingNames = new Set(existingRows.map((r) => r.tableName));
    const conflict = findNameConflict(
      entries.map((e) => e.tableName),
      existingNames,
    );
    if (conflict) {
      throw new BadRequestException(
        `Generated table identifier "${conflict}" already exists. Retry the request.`,
      );
    }

    const agg = await this.prisma.venueTableConfig.aggregate({
      _max: { sortOrder: true },
    });
    const baseSortOrder = (agg._max.sortOrder ?? -1) + 1;

    const created = await this.prisma.$transaction(
      entries.map((entry, index) =>
        this.prisma.venueTableConfig.create({
          data: {
            id: entry.id,
            tableName: entry.tableName,
            size: dto.size,
            includedChairs,
            bundlePrice: dto.bundlePrice,
            isActive: true,
            sortOrder: baseSortOrder + index,
          },
        }),
      ),
    );

    const mapped = created.map((row) => this.mapRow(row));
    return { created: mapped, count: mapped.length };
  }

  async updateAdminVenueTable(id: string, dto: UpdateVenueTableConfigDto) {
    const existing = await this.findById(id);
    const size = dto.size ?? existing.size;
    const includedChairs =
      dto.includedChairs !== undefined
        ? this.resolveChairs(size, dto.includedChairs)
        : dto.size !== undefined
          ? clampChairsForSize(size, existing.includedChairs)
          : existing.includedChairs;

    const tableName =
      dto.size !== undefined && dto.size !== existing.size
        ? buildTechnicalTableName(size, existing.id)
        : undefined;

    const updated = await this.prisma.venueTableConfig.update({
      where: { id },
      data: {
        ...(tableName !== undefined ? { tableName } : {}),
        ...(dto.size !== undefined ? { size: dto.size } : {}),
        includedChairs,
        ...(dto.bundlePrice !== undefined
          ? { bundlePrice: dto.bundlePrice }
          : {}),
        ...(dto.visualX !== undefined ? { visualX: dto.visualX } : {}),
        ...(dto.visualY !== undefined ? { visualY: dto.visualY } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return this.mapRow(updated);
  }

  async deleteAdminVenueTable(id: string) {
    await this.findById(id);
    const onLayout = await this.floorLayoutService.isTablePlacedOnLayout(id);
    if (onLayout) {
      throw new BadRequestException(
        'This table is placed on the On Coming Events floor plan. Remove it from the floor plan before deactivating.',
      );
    }
    const updated = await this.prisma.venueTableConfig.update({
      where: { id },
      data: { isActive: false },
    });
    return this.mapRow(updated);
  }

  async bulkDeleteAdminVenueTables(dto: BulkDeleteVenueTableConfigDto) {
    if (dto.scope === VenueTableBulkDeleteScope.SIZE && !dto.size) {
      throw new BadRequestException('size is required when scope is SIZE.');
    }

    return this.prisma.$transaction(async (tx) => {
      const targets = await tx.venueTableConfig.findMany({
        where: {
          isActive: true,
          ...(dto.scope === VenueTableBulkDeleteScope.SIZE && dto.size
            ? { size: dto.size }
            : {}),
        },
        select: { id: true },
      });

      if (targets.length === 0) {
        return {
          scope: dto.scope,
          size: dto.size ?? null,
          deletedCount: 0,
        };
      }

      const ids = targets.map((t) => t.id);
      await this.cleanupDeletedTableReferencesFromLayout(tx, ids);

      const deleted = await tx.venueTableConfig.deleteMany({
        where: { id: { in: ids } },
      });

      return {
        scope: dto.scope,
        size: dto.size ?? null,
        deletedCount: deleted.count,
      };
    });
  }

  private resolveChairs(size: VenueTableSize, chairs: number): number {
    const { min, max } = CHAIR_LIMITS[size];
    const rounded = Math.round(chairs);
    if (rounded < min || rounded > max) {
      throw new BadRequestException(
        `includedChairs for ${size} must be between ${min} and ${max}.`,
      );
    }
    return clampChairsForSize(size, rounded);
  }

  private async findById(id: string): Promise<VenueTableConfig> {
    const row = await this.prisma.venueTableConfig.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException('Venue table configuration not found.');
    }
    return row;
  }

  private mapRow(row: VenueTableConfig) {
    return {
      id: row.id,
      tableName: row.tableName,
      displayLabel: formatVenueTableSizeLabel(row.size),
      size: row.size,
      includedChairs: row.includedChairs,
      bundlePrice: this.decimalToNumber(row.bundlePrice),
      visualCoordinates:
        row.visualX != null && row.visualY != null
          ? { x: row.visualX, y: row.visualY }
          : null,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | number): number {
    return typeof value === 'number' ? value : Number(value.toString());
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

    const items = this.parseLayoutItems(layout.items);
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
        item.kind === 'catalog_table' &&
        typeof item.id === 'string' &&
        typeof item.venueTableConfigId === 'string' &&
        typeof item.tableName === 'string' &&
        typeof item.size === 'string' &&
        typeof item.includedChairs === 'number' &&
        typeof item.x === 'number' &&
        typeof item.y === 'number' &&
        typeof item.rotation === 'number'
      ) {
        output.push({
          id: item.id,
          kind: 'catalog_table',
          venueTableConfigId: item.venueTableConfigId,
          tableName: item.tableName,
          size: item.size as 'LARGE' | 'MEDIUM' | 'SMALL',
          includedChairs: item.includedChairs,
          x: item.x,
          y: item.y,
          rotation: item.rotation,
        });
        continue;
      }
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
              : 'Chair',
          x: item.x,
          y: item.y,
          rotation: item.rotation,
        });
      }
    }
    return output;
  }
}
