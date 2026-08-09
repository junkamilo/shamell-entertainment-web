import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VenueTableSize } from '@prisma/client';
import { randomUUID } from 'crypto';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import {
  CHAIR_LIMITS,
  clampChairsForSize,
} from '../constants/venue-tables.constants';
import { BulkCreateVenueTableConfigDto } from '../dto/bulk-create-venue-table-config.dto';
import {
  BulkDeleteVenueTableConfigDto,
  VenueTableBulkDeleteScope,
} from '../dto/bulk-delete-venue-table-config.dto';
import { PatchVenueTablesBulkPriceDto } from '../dto/patch-venue-tables-bulk-price.dto';
import { CreateVenueTableConfigDto } from '../dto/create-venue-table-config.dto';
import { UpdateVenueTableConfigDto } from '../dto/update-venue-table-config.dto';
import {
  buildTechnicalTableName,
  findNameConflict,
  generateTechnicalTableNameEntries,
} from '../utils/venue-table-names.util';
import { mapVenueTableRow } from '../utils/venue-tables-mapper.util';
import { VenueTablesRepository } from './venue-tables.repository';

@Injectable()
export class VenueTablesService {
  constructor(
    private readonly repository: VenueTablesRepository,
    private readonly floorLayoutService: FloorLayoutService,
  ) {}

  async getPublicVenueTables() {
    const rows = await this.repository.findActiveTables();
    return rows.map((row) => mapVenueTableRow(row));
  }

  async getAdminVenueTables() {
    const rows = await this.repository.findAllTables();
    return rows.map((row) => mapVenueTableRow(row));
  }

  async getAdminVenueTableById(id: string) {
    const row = await this.requireById(id);
    return mapVenueTableRow(row);
  }

  async createAdminVenueTable(dto: CreateVenueTableConfigDto) {
    const includedChairs = this.resolveChairs(dto.size, dto.includedChairs);
    const id = randomUUID();
    const tableName =
      dto.tableName?.trim() || buildTechnicalTableName(dto.size, id);

    const created = await this.repository.create({
      id,
      tableName,
      size: dto.size,
      includedChairs,
      bundlePrice: dto.bundlePrice,
      visualX: dto.visualX ?? null,
      visualY: dto.visualY ?? null,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
    return mapVenueTableRow(created);
  }

  async bulkCreateAdminVenueTables(dto: BulkCreateVenueTableConfigDto) {
    const includedChairs = this.resolveChairs(dto.size, dto.includedChairs);
    const entries = generateTechnicalTableNameEntries(dto.size, dto.quantity);

    const existingRows = await this.repository.findAllTableNames();
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

    const baseSortOrder = (await this.repository.maxSortOrder()) + 1;
    const created = await this.repository.createManyFromEntries(entries, {
      size: dto.size,
      includedChairs,
      bundlePrice: dto.bundlePrice,
      baseSortOrder,
    });

    const mapped = created.map((row) => mapVenueTableRow(row));
    return { created: mapped, count: mapped.length };
  }

  async updateAdminVenueTable(id: string, dto: UpdateVenueTableConfigDto) {
    const existing = await this.requireById(id);
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

    const updated = await this.repository.update(id, {
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
    });
    return mapVenueTableRow(updated);
  }

  async deleteAdminVenueTable(id: string) {
    await this.requireById(id);
    const onLayout = await this.floorLayoutService.isTablePlacedOnLayout(id);
    if (onLayout) {
      throw new BadRequestException(
        'This table is placed on the On Coming Events floor plan. Remove it from the floor plan before deactivating.',
      );
    }
    const updated = await this.repository.update(id, { isActive: false });
    return mapVenueTableRow(updated);
  }

  async bulkUpdateAdminVenueTablesBundlePrice(
    dto: PatchVenueTablesBulkPriceDto,
  ) {
    if (dto.scope !== VenueTableBulkDeleteScope.SIZE || !dto.size) {
      throw new BadRequestException(
        'scope SIZE with size is required for bulk bundle price updates.',
      );
    }

    const updated = await this.repository.updateManyActiveBySize(
      dto.size,
      dto.bundlePrice,
    );

    return {
      scope: dto.scope,
      size: dto.size,
      updatedCount: updated.count,
    };
  }

  async bulkDeleteAdminVenueTables(dto: BulkDeleteVenueTableConfigDto) {
    if (dto.scope === VenueTableBulkDeleteScope.SIZE && !dto.size) {
      throw new BadRequestException('size is required when scope is SIZE.');
    }

    const result = await this.repository.bulkDeleteActiveTables({
      size: dto.scope === VenueTableBulkDeleteScope.SIZE ? dto.size : undefined,
    });

    return {
      scope: dto.scope,
      size: result.size,
      deletedCount: result.deletedCount,
    };
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

  private async requireById(id: string) {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new NotFoundException('Venue table configuration not found.');
    }
    return row;
  }
}
