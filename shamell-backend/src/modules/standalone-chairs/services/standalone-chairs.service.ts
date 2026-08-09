import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { FloorLayoutService } from '../../floor-layout/services/floor-layout.service';
import { PatchStandaloneChairDto } from '../dto/patch-standalone-chair.dto';
import { PatchStandaloneChairsBulkPriceDto } from '../dto/patch-standalone-chairs-bulk-price.dto';
import { UpsertStandaloneChairConfigDto } from '../dto/upsert-standalone-chair-config.dto';
import type { StandaloneChairConfigRow } from '../types/standalone-chairs.types';
import { generateTechnicalChairNameEntries } from '../utils/standalone-chair-names.util';
import {
  decimalToNumber,
  mapChairRow,
  mapPublicChairListItem,
} from '../utils/standalone-chairs-mapper.util';
import {
  buildChairPlacementMap,
  buildReservedLayoutItemMap,
  enrichChairWithReservationState,
  enrichChairsWithReservationState,
} from '../utils/standalone-chairs-reservation.util';
import { StandaloneChairsRepository } from './standalone-chairs.repository';

@Injectable()
export class StandaloneChairsService {
  constructor(
    private readonly repository: StandaloneChairsRepository,
    private readonly floorLayout: FloorLayoutService,
  ) {}

  async getPublicStandaloneChairs() {
    const row = await this.repository.findActiveConfig();
    let activeCount = await this.repository.countActiveChairs();
    if (row && row.availableQuantity > 0 && activeCount === 0) {
      await this.materializeChairsFromLegacyConfig(row);
      activeCount = await this.repository.countActiveChairs();
    }
    const unitPrice = await this.resolveUnitPrice(row, activeCount);
    const chairs = await this.repository.findActiveChairsPublic();
    return {
      id: row?.id ?? null,
      availableQuantity: activeCount,
      unitPrice,
      updatedAt: row?.updatedAt ?? null,
      isDefault: !row && activeCount === 0,
      chairs: chairs.map((chair) => mapPublicChairListItem(chair)),
    };
  }

  async getAdminStandaloneChairs() {
    const row = await this.repository.findActiveConfig();
    let chairCount = await this.repository.countActiveChairs();
    if (row && row.availableQuantity > 0 && chairCount === 0) {
      await this.materializeChairsFromLegacyConfig(row);
      chairCount = await this.repository.countActiveChairs();
    }

    const chairs = await this.repository.findActiveChairs();
    const activeCount = chairs.length;
    const unitPrice = await this.resolveUnitPrice(row, activeCount, chairs);
    const { placementMap, reservations } =
      await this.getChairReservationContext();
    const enrichedChairs = enrichChairsWithReservationState(
      chairs.map((chair) => mapChairRow(chair)),
      placementMap,
      reservations,
    );
    const reservedCount = enrichedChairs.filter((c) => c.isReserved).length;

    return {
      id: row?.id ?? null,
      availableQuantity: activeCount,
      unitPrice,
      updatedAt: row?.updatedAt ?? chairs[0]?.updatedAt ?? null,
      isDefault: !row && activeCount === 0,
      reservedCount,
      totalCount: activeCount,
      chairs: enrichedChairs,
    };
  }

  async patchAdminStandaloneChair(id: string, dto: PatchStandaloneChairDto) {
    const chair = await this.repository.findActiveChairById(id);
    if (!chair) {
      throw new NotFoundException('Standalone chair not found.');
    }

    const { placementMap, reservations } =
      await this.getChairReservationContext();
    const reservedLayoutItems = buildReservedLayoutItemMap(reservations);
    const flags = enrichChairWithReservationState(
      id,
      placementMap,
      reservedLayoutItems,
    );
    if (!flags.canEditPrice) {
      throw new BadRequestException(
        'Cannot change price: this chair has an active reservation.',
      );
    }

    await this.repository.updateChairUnitPrice(id, dto.unitPrice);
    await this.floorLayout.syncStandaloneChairUnitPricesInActiveLayout();

    return this.getAdminStandaloneChairs();
  }

  async patchAdminStandaloneChairsBulkPrice(
    dto: PatchStandaloneChairsBulkPriceDto,
  ) {
    const { placementMap, reservations } =
      await this.getChairReservationContext();
    const chairs = await this.repository.findActiveChairIds();
    const enriched = enrichChairsWithReservationState(
      chairs,
      placementMap,
      reservations,
    );
    const reservedCount = enriched.filter((c) => c.isReserved).length;
    if (reservedCount > 0) {
      throw new BadRequestException(
        `Cannot change all prices: ${reservedCount} chair(s) have active reservations.`,
      );
    }

    await this.repository.updateAllActiveUnitPrices(dto.unitPrice);
    await this.floorLayout.syncStandaloneChairUnitPricesInActiveLayout();

    return this.getAdminStandaloneChairs();
  }

  async deleteAdminStandaloneChair(id: string) {
    const chair = await this.repository.findActiveChairById(id);
    if (!chair) {
      throw new NotFoundException('Standalone chair not found.');
    }

    const { placementMap, reservations } =
      await this.getChairReservationContext();
    const reservedLayoutItems = buildReservedLayoutItemMap(reservations);
    const flags = enrichChairWithReservationState(
      id,
      placementMap,
      reservedLayoutItems,
    );
    if (!flags.canDelete) {
      throw new BadRequestException(
        'Cannot delete: this chair has an active reservation.',
      );
    }

    await this.repository.cleanupDeletedChairReferencesFromLayout([id]);
    await this.repository.deleteChair(id);
    await this.syncConfigQuantityAfterDelete();

    return this.getAdminStandaloneChairs();
  }

  async deleteAllAdminStandaloneChairs() {
    const { placementMap, reservations } =
      await this.getChairReservationContext();
    const chairs = await this.repository.findActiveChairIds();
    const enriched = enrichChairsWithReservationState(
      chairs,
      placementMap,
      reservations,
    );
    const reservedCount = enriched.filter((c) => c.isReserved).length;
    if (reservedCount > 0) {
      throw new BadRequestException(
        `Cannot delete all chairs: ${reservedCount} chair(s) have active reservations.`,
      );
    }

    const ids = chairs.map((c) => c.id);
    if (ids.length > 0) {
      await this.repository.cleanupDeletedChairReferencesFromLayout(ids);
      await this.repository.deleteChairsByIds(ids);
    }
    await this.syncConfigQuantityAfterDelete();

    return this.getAdminStandaloneChairs();
  }

  async upsertAdminStandaloneChairs(dto: UpsertStandaloneChairConfigDto) {
    const targetQuantity = Math.round(dto.availableQuantity);
    const unitPrice = dto.unitPrice;

    const placedChairIds = await this.repository.getPlacedStandaloneChairIds();
    const activeChairs = await this.repository.findActiveChairsDesc();

    if (targetQuantity > activeChairs.length) {
      const toCreate = targetQuantity - activeChairs.length;
      const maxSort = await this.repository.maxSortOrder();
      const entries = generateTechnicalChairNameEntries(toCreate);
      await this.repository.createChairsFromEntries(
        entries,
        unitPrice,
        maxSort + 1,
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
      await this.repository.cleanupDeletedChairReferencesFromLayout(
        idsToDelete,
      );
      await this.repository.deleteChairsByIds(idsToDelete);
    }

    const addedChairs = targetQuantity > activeChairs.length;

    const existing = await this.repository.findActiveConfig();
    if (existing) {
      await this.repository.updateConfigQuantity(
        existing.id,
        targetQuantity,
        addedChairs ? unitPrice : undefined,
      );
    } else if (targetQuantity > 0) {
      await this.repository.createConfig(targetQuantity, unitPrice);
    }

    return this.getAdminStandaloneChairs();
  }

  private async getChairReservationContext() {
    const layoutItems = await this.repository.getActiveLayoutItems();
    const placementMap = buildChairPlacementMap(layoutItems);
    const reservations =
      await this.repository.findPaidStandaloneChairReservations();
    return { placementMap, reservations, layoutItems };
  }

  private async syncConfigQuantityAfterDelete() {
    const activeCount = await this.repository.countActiveChairs();
    const existing = await this.repository.findActiveConfig();
    if (existing) {
      await this.repository.updateConfigQuantity(existing.id, activeCount);
    }
  }

  private async resolveUnitPrice(
    config: { unitPrice: Prisma.Decimal | number } | null,
    activeCount: number,
    chairs?: { unitPrice: Prisma.Decimal | number }[],
  ): Promise<number> {
    if (config) return decimalToNumber(config.unitPrice);
    if (chairs && chairs.length > 0) {
      return decimalToNumber(chairs[0].unitPrice);
    }
    if (activeCount === 0) return 0;
    const first = await this.repository.findFirstActiveChair();
    return first ? decimalToNumber(first.unitPrice) : 0;
  }

  private async materializeChairsFromLegacyConfig(
    row: StandaloneChairConfigRow,
  ) {
    const quantity = Math.round(row.availableQuantity);
    if (quantity <= 0) return;

    const entries = generateTechnicalChairNameEntries(quantity);
    const unitPrice = decimalToNumber(row.unitPrice);
    await this.repository.createChairsFromEntries(entries, unitPrice, 0);
  }
}
