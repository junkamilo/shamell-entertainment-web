import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { STANDALONE_CHAIR_DISPLAY_LABEL } from '../../standalone-chairs/utils/standalone-chair-names.util';
import { formatVenueTableSizeLabel } from '../../venue-tables/utils/venue-table-names.util';
import {
  DEFAULT_BACKGROUND_VERSION,
  DEFAULT_VIEW_BOX_HEIGHT,
  DEFAULT_VIEW_BOX_WIDTH,
} from '../constants/floor-layout.constants';
import { UpsertFloorLayoutDto } from '../dto/upsert-floor-layout.dto';
import type {
  FloorLayoutMapped,
  FloorLayoutPalette,
  PlacedLayoutItem,
  VenueTableSizeLabel,
} from '../types/floor-layout.types';
import {
  applyChairPricesToRawItems,
  collectStandaloneChairIdsFromRaw,
  enrichItemsWithChairPrices,
  mapLayoutRow,
  mapVirtualLayout,
  normalizeItems,
  parseItemsLenient,
} from '../utils/floor-layout-items.util';
import { normalizeFloorSceneZonesInput } from '../utils/floor-scene-zones.util';
import { FloorLayoutRepository } from './floor-layout.repository';

@Injectable()
export class FloorLayoutService {
  constructor(private readonly repository: FloorLayoutRepository) {}

  async getPublicFloorLayout() {
    await this.assertClientPublishEnabled();
    return this.getPublicFloorLayoutForClient();
  }

  async getPublicFloorLayoutForClient(floorLayoutId?: string | null) {
    const row = floorLayoutId
      ? await this.repository.findLayoutById(floorLayoutId)
      : await this.repository.findActiveLayout();
    if (!row) {
      return this.mapVirtualLayout(null);
    }
    return this.enrichLayoutChairPrices(this.mapRow(row));
  }

  private async assertClientPublishEnabled() {
    const settings = await this.repository.findClientSettings();
    if (settings?.clientEnabled) {
      return;
    }
    // A published per-event seat-sales config also exposes the shared floor
    // plan, so admins don't have to flip the global publish toggle too.
    const publishedEvents =
      await this.repository.countClientEnabledUpcomingConfigs();
    if (publishedEvents === 0) {
      throw new NotFoundException('Venue floor plan is not available.');
    }
  }

  async getAdminFloorLayout() {
    const row = await this.repository.findActiveLayout();
    if (!row) {
      return this.mapVirtualLayout(null);
    }
    return this.enrichLayoutChairPrices(this.mapRow(row));
  }

  async getAdminPalette(): Promise<FloorLayoutPalette> {
    const layoutRow = await this.repository.findActiveLayout();
    const layoutItems = layoutRow ? parseItemsLenient(layoutRow.items) : [];

    const placedTableIds = new Set(
      layoutItems
        .filter(
          (i): i is Extract<PlacedLayoutItem, { kind: 'catalog_table' }> =>
            i.kind === 'catalog_table',
        )
        .map((i) => i.venueTableConfigId),
    );

    const placedChairIds = new Set(
      layoutItems
        .filter(
          (i): i is Extract<PlacedLayoutItem, { kind: 'standalone_chair' }> =>
            i.kind === 'standalone_chair',
        )
        .map((i) => i.venueStandaloneChairId),
    );

    const activeChairs = await this.repository.findActiveChairsForPalette();
    const unplacedChairs = activeChairs
      .filter((c) => !placedChairIds.has(c.id))
      .map((c) => ({
        id: c.id,
        chairName: c.chairName,
        displayLabel: STANDALONE_CHAIR_DISPLAY_LABEL,
        unitPrice: Number(c.unitPrice),
        sortOrder: c.sortOrder,
      }));

    const activeTables = await this.repository.findActiveTablesForPalette();
    const unplacedTables = activeTables
      .filter((t) => !placedTableIds.has(t.id))
      .map((t) => ({
        id: t.id,
        tableName: t.tableName,
        displayLabel: formatVenueTableSizeLabel(t.size),
        size: t.size,
        includedChairs: t.includedChairs,
        sortOrder: t.sortOrder,
      }));

    const tablesBySize: Record<VenueTableSizeLabel, number> = {
      LARGE: 0,
      MEDIUM: 0,
      SMALL: 0,
    };
    for (const t of unplacedTables) {
      tablesBySize[t.size] += 1;
    }

    const placedChairCount = placedChairIds.size;

    return {
      tablesBySize,
      standaloneChairsAvailable: unplacedChairs.length,
      unplacedTables,
      unplacedChairs,
      placedTableIds: [...placedTableIds],
      placedChairIds: [...placedChairIds],
      placedChairCount,
    };
  }

  async upsertAdminFloorLayout(dto: UpsertFloorLayoutDto) {
    const viewBoxWidth = dto.viewBoxWidth ?? DEFAULT_VIEW_BOX_WIDTH;
    const viewBoxHeight = dto.viewBoxHeight ?? DEFAULT_VIEW_BOX_HEIGHT;
    const backgroundVersion =
      dto.backgroundVersion?.trim() || DEFAULT_BACKGROUND_VERSION;

    const [activeTables, activeChairs] = await Promise.all([
      this.repository.findAllActiveTables(),
      this.repository.findAllActiveStandaloneChairs(),
    ]);

    const items = normalizeItems(dto.items, viewBoxWidth, viewBoxHeight, {
      tables: activeTables.map((t) => ({
        id: t.id,
        size: t.size,
        includedChairs: t.includedChairs,
      })),
      chairs: activeChairs.map((c) => ({ id: c.id })),
      tableDisplayLabel: formatVenueTableSizeLabel,
      chairDisplayLabel: STANDALONE_CHAIR_DISPLAY_LABEL,
    });

    const existing = await this.repository.findActiveLayout();
    const itemsJson = items as unknown as Prisma.InputJsonValue;
    const sceneZones = normalizeFloorSceneZonesInput(dto.sceneZones);
    const sceneZonesJson = sceneZones as unknown as Prisma.InputJsonValue;

    const row = await this.repository.upsertLayoutWithSideEffects({
      existingId: existing?.id ?? null,
      data: {
        viewBoxWidth,
        viewBoxHeight,
        backgroundVersion,
        items: itemsJson,
        sceneZones: sceneZonesJson,
      },
      items,
    });

    return this.mapRow(row);
  }

  async isTablePlacedOnLayout(tableId: string): Promise<boolean> {
    const row = await this.repository.findActiveLayout();
    if (!row) return false;
    const items = parseItemsLenient(row.items);
    return items.some(
      (i) => i.kind === 'catalog_table' && i.venueTableConfigId === tableId,
    );
  }

  /** Active layout saved from the admin 3D editor (shared default floor plan). */
  async getActiveFloorLayoutId(): Promise<string | null> {
    const row = await this.repository.findActiveLayout();
    return row?.id ?? null;
  }

  /**
   * Writes current DB chair prices into the active layout JSON so every consumer
   * (public 3D, admin editor, cached clients) sees the same unitPrice.
   */
  async syncStandaloneChairUnitPricesInActiveLayout(): Promise<void> {
    const layout = await this.repository.findActiveLayout();
    if (!layout || !Array.isArray(layout.items)) return;

    const chairIds = collectStandaloneChairIdsFromRaw(layout.items);
    if (chairIds.size === 0) return;

    const chairs = await this.repository.findActiveStandaloneChairsByIds([
      ...chairIds,
    ]);
    const priceById = new Map(
      chairs.map((chair) => [chair.id, Number(chair.unitPrice)]),
    );

    const { items: nextItems, changed } = applyChairPricesToRawItems(
      layout.items as unknown[],
      priceById,
    );
    if (!changed) return;

    await this.repository.updateLayoutItems(
      layout.id,
      nextItems as Prisma.JsonArray,
    );
  }

  private mapVirtualLayout(id: string | null): FloorLayoutMapped {
    return mapVirtualLayout(id);
  }

  private mapRow(row: Parameters<typeof mapLayoutRow>[0]): FloorLayoutMapped {
    return mapLayoutRow(row);
  }

  private async enrichLayoutChairPrices<
    T extends { items: PlacedLayoutItem[] },
  >(layout: T): Promise<T> {
    const chairIds = layout.items
      .filter(
        (
          item,
        ): item is Extract<PlacedLayoutItem, { kind: 'standalone_chair' }> =>
          item.kind === 'standalone_chair',
      )
      .map((item) => item.venueStandaloneChairId);

    if (chairIds.length === 0) {
      return layout;
    }

    const chairs =
      await this.repository.findActiveStandaloneChairsByIds(chairIds);
    const priceById = new Map(
      chairs.map((chair) => [chair.id, Number(chair.unitPrice)]),
    );

    return {
      ...layout,
      items: enrichItemsWithChairPrices(layout.items, priceById),
    };
  }
}
