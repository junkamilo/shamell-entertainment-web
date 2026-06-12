import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PlacedLayoutItemDto } from './dto/placed-layout-item.dto';
import { UpsertFloorLayoutDto } from './dto/upsert-floor-layout.dto';
import {
  chairCountForItem,
  DEFAULT_BACKGROUND_VERSION,
  DEFAULT_VIEW_BOX_HEIGHT,
  DEFAULT_VIEW_BOX_WIDTH,
  getDefaultLayoutItems,
  isLegacyLayoutKind,
  LAYOUT_SHAPE_KINDS,
  type PlacedLayoutItem,
  VENUE_TABLE_SIZES,
  type VenueTableSizeLabel,
} from './floor-layout.defaults';
import {
  DEFAULT_FLOOR_SCENE_ZONES,
  mergeFloorSceneZones,
  normalizeFloorSceneZonesInput,
} from './floor-scene-zones.defaults';
import { STANDALONE_CHAIR_DISPLAY_LABEL } from '../standalone-chairs/standalone-chair-names.util';
import { formatVenueTableSizeLabel } from '../venue-tables/venue-table-names.util';

const FLOOR_LAYOUT_UPSERT_TX_TIMEOUT_MS = 30_000;

@Injectable()
export class FloorLayoutService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicFloorLayout() {
    await this.assertClientPublishEnabled();
    return this.getPublicFloorLayoutForClient();
  }

  async getPublicFloorLayoutForClient(floorLayoutId?: string | null) {
    const row = floorLayoutId
      ? await this.prisma.venueFloorLayout.findUnique({
          where: { id: floorLayoutId },
        })
      : await this.findActiveRow();
    if (!row) {
      return this.mapVirtualLayout(null);
    }
    return this.enrichLayoutChairPrices(this.mapRow(row));
  }

  private async assertClientPublishEnabled() {
    const settings = await this.prisma.venueLayoutClientSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    if (settings?.clientEnabled) {
      return;
    }
    // A published per-event seat-sales config also exposes the shared floor
    // plan, so admins don't have to flip the global publish toggle too.
    const publishedEvents = await this.prisma.upcomingVenueConfig.count({
      where: { clientEnabled: true },
    });
    if (publishedEvents === 0) {
      throw new NotFoundException('Venue floor plan is not available.');
    }
  }

  async getAdminFloorLayout() {
    const row = await this.findActiveRow();
    if (!row) {
      return this.mapVirtualLayout(null);
    }
    return this.enrichLayoutChairPrices(this.mapRow(row));
  }

  async getAdminPalette() {
    const layoutRow = await this.findActiveRow();
    const layoutItems = layoutRow
      ? this.parseItemsLenient(layoutRow.items)
      : [];

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

    const activeChairs = await this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        chairName: true,
        unitPrice: true,
        sortOrder: true,
      },
    });

    const unplacedChairs = activeChairs
      .filter((c) => !placedChairIds.has(c.id))
      .map((c) => ({
        id: c.id,
        chairName: c.chairName,
        displayLabel: STANDALONE_CHAIR_DISPLAY_LABEL,
        unitPrice: Number(c.unitPrice),
        sortOrder: c.sortOrder,
      }));

    const activeTables = await this.prisma.venueTableConfig.findMany({
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

    const items = await this.normalizeItems(
      dto.items,
      viewBoxWidth,
      viewBoxHeight,
    );

    const existing = await this.prisma.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    const itemsJson = items as unknown as Prisma.InputJsonValue;
    const sceneZones = normalizeFloorSceneZonesInput(dto.sceneZones);
    const sceneZonesJson = sceneZones as unknown as Prisma.InputJsonValue;

    const row = await this.prisma.$transaction(
      async (tx) => {
        const saved = existing
          ? await tx.venueFloorLayout.update({
              where: { id: existing.id },
              data: {
                viewBoxWidth,
                viewBoxHeight,
                backgroundVersion,
                items: itemsJson,
                sceneZones: sceneZonesJson,
              },
            })
          : await tx.venueFloorLayout.create({
              data: {
                viewBoxWidth,
                viewBoxHeight,
                backgroundVersion,
                items: itemsJson,
                sceneZones: sceneZonesJson,
                isActive: true,
              },
            });

        await this.syncTableVisualCoordinates(tx, items);

        // Link the saved plan to venue events that never got an explicit floorLayoutId.
        await tx.upcomingVenueConfig.updateMany({
          where: { floorLayoutId: null },
          data: { floorLayoutId: saved.id },
        });

        return saved;
      },
      { timeout: FLOOR_LAYOUT_UPSERT_TX_TIMEOUT_MS },
    );

    return this.mapRow(row);
  }

  async isTablePlacedOnLayout(tableId: string): Promise<boolean> {
    const row = await this.findActiveRow();
    if (!row) return false;
    const items = this.parseItemsLenient(row.items);
    return items.some(
      (i) => i.kind === 'catalog_table' && i.venueTableConfigId === tableId,
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

  /** Active layout saved from the admin 3D editor (shared default floor plan). */
  async getActiveFloorLayoutId(): Promise<string | null> {
    const row = await this.findActiveRow();
    return row?.id ?? null;
  }

  private async findActiveRow() {
    return this.prisma.venueFloorLayout.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  private async normalizeItems(
    raw: PlacedLayoutItemDto[],
    viewBoxWidth: number,
    viewBoxHeight: number,
  ): Promise<PlacedLayoutItem[]> {
    const margin = 8;
    const seenIds = new Set<string>();
    const seenTableIds = new Set<string>();

    for (const item of raw) {
      if (isLegacyLayoutKind(item.kind)) {
        throw new BadRequestException(
          'Legacy layout items are no longer supported. Clear placed items and save again.',
        );
      }
    }

    const activeTables = await this.prisma.venueTableConfig.findMany({
      where: { isActive: true },
    });
    const tableById = new Map(activeTables.map((t) => [t.id, t]));

    const activeChairs = await this.prisma.venueStandaloneChair.findMany({
      where: { isActive: true },
    });
    const chairById = new Map(activeChairs.map((c) => [c.id, c]));
    const maxStandaloneChairs = activeChairs.length;
    const seenChairIds = new Set<string>();
    let standaloneChairCount = 0;

    const normalized: PlacedLayoutItem[] = [];

    for (const item of raw) {
      if (seenIds.has(item.id)) {
        throw new BadRequestException('Duplicate layout item id.');
      }
      seenIds.add(item.id);

      if (!LAYOUT_SHAPE_KINDS.includes(item.kind)) {
        throw new BadRequestException(`Invalid shape kind: ${item.kind}`);
      }

      const x = Math.min(Math.max(item.x, margin), viewBoxWidth - margin);
      const y = Math.min(Math.max(item.y, margin), viewBoxHeight - margin);
      const rotation = Math.min(180, Math.max(-180, item.rotation));

      if (item.kind === 'standalone_chair') {
        if (!item.venueStandaloneChairId) {
          throw new BadRequestException(
            'standalone_chair items require venueStandaloneChairId.',
          );
        }
        if (seenChairIds.has(item.venueStandaloneChairId)) {
          throw new BadRequestException(
            `Chair "${item.venueStandaloneChairId}" is placed more than once on the layout.`,
          );
        }
        seenChairIds.add(item.venueStandaloneChairId);

        const chair = chairById.get(item.venueStandaloneChairId);
        if (!chair) {
          throw new BadRequestException(
            `Standalone chair "${item.venueStandaloneChairId}" not found or inactive.`,
          );
        }

        standaloneChairCount += 1;
        if (standaloneChairCount > maxStandaloneChairs) {
          throw new BadRequestException(
            `Cannot place more than ${maxStandaloneChairs} standalone chairs.`,
          );
        }
        normalized.push({
          id: item.id,
          kind: 'standalone_chair',
          venueStandaloneChairId: chair.id,
          chairName: STANDALONE_CHAIR_DISPLAY_LABEL,
          x,
          y,
          rotation,
        });
        continue;
      }

      if (!item.venueTableConfigId) {
        throw new BadRequestException(
          'catalog_table items require venueTableConfigId.',
        );
      }
      if (seenTableIds.has(item.venueTableConfigId)) {
        throw new BadRequestException(
          `Table "${item.venueTableConfigId}" is placed more than once on the layout.`,
        );
      }
      seenTableIds.add(item.venueTableConfigId);

      const table = tableById.get(item.venueTableConfigId);
      if (!table) {
        throw new BadRequestException(
          `Venue table "${item.venueTableConfigId}" not found or inactive.`,
        );
      }

      normalized.push({
        id: item.id,
        kind: 'catalog_table',
        venueTableConfigId: table.id,
        tableName: formatVenueTableSizeLabel(table.size),
        size: table.size,
        includedChairs: table.includedChairs,
        x,
        y,
        rotation,
      });
    }

    return normalized;
  }

  private mapVirtualLayout(id: string | null) {
    const items = getDefaultLayoutItems();
    return {
      id,
      viewBoxWidth: DEFAULT_VIEW_BOX_WIDTH,
      viewBoxHeight: DEFAULT_VIEW_BOX_HEIGHT,
      backgroundVersion: DEFAULT_BACKGROUND_VERSION,
      items,
      sceneZones: { ...DEFAULT_FLOOR_SCENE_ZONES },
      totalChairs: this.sumChairs(items),
      updatedAt: null as Date | null,
      isDefault: true,
      hasLegacyItems: false,
    };
  }

  private mapRow(row: {
    id: string;
    viewBoxWidth: number;
    viewBoxHeight: number;
    backgroundVersion: string;
    items: unknown;
    sceneZones: unknown;
    updatedAt: Date;
  }) {
    const items = this.parseItems(row.items);
    const hasLegacyItems = this.hasLegacyItemsRaw(row.items);
    const sceneZones = mergeFloorSceneZones(row.sceneZones);
    return {
      id: row.id,
      viewBoxWidth: row.viewBoxWidth,
      viewBoxHeight: row.viewBoxHeight,
      backgroundVersion: row.backgroundVersion,
      items,
      sceneZones,
      totalChairs: this.sumChairs(items),
      updatedAt: row.updatedAt,
      isDefault: false,
      hasLegacyItems,
    };
  }

  /**
   * Writes current DB chair prices into the active layout JSON so every consumer
   * (public 3D, admin editor, cached clients) sees the same unitPrice.
   */
  async syncStandaloneChairUnitPricesInActiveLayout(): Promise<void> {
    const layout = await this.findActiveRow();
    if (!layout || !Array.isArray(layout.items)) return;

    const chairIds = new Set<string>();
    for (const entry of layout.items) {
      if (!entry || typeof entry !== 'object') continue;
      const o = entry as Record<string, unknown>;
      if (
        o.kind === 'standalone_chair' &&
        typeof o.venueStandaloneChairId === 'string'
      ) {
        chairIds.add(o.venueStandaloneChairId);
      }
    }
    if (chairIds.size === 0) return;

    const chairs = await this.prisma.venueStandaloneChair.findMany({
      where: { id: { in: [...chairIds] }, isActive: true },
      select: { id: true, unitPrice: true },
    });
    const priceById = new Map(
      chairs.map((chair) => [chair.id, Number(chair.unitPrice)]),
    );

    let changed = false;
    const nextItems = (layout.items as unknown[]).map((entry) => {
      if (!entry || typeof entry !== 'object') return entry;
      const o = entry as Record<string, unknown>;
      if (
        o.kind !== 'standalone_chair' ||
        typeof o.venueStandaloneChairId !== 'string'
      ) {
        return entry;
      }
      const nextPrice = priceById.get(o.venueStandaloneChairId);
      if (nextPrice === undefined) return entry;
      const current =
        typeof o.unitPrice === 'number' && Number.isFinite(o.unitPrice)
          ? o.unitPrice
          : undefined;
      if (current === nextPrice) return entry;
      changed = true;
      return { ...o, unitPrice: nextPrice };
    });

    if (!changed) return;

    await this.prisma.venueFloorLayout.update({
      where: { id: layout.id },
      data: { items: nextItems as Prisma.JsonArray },
    });
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

    const chairs = await this.prisma.venueStandaloneChair.findMany({
      where: { id: { in: chairIds }, isActive: true },
      select: { id: true, unitPrice: true },
    });
    const priceById = new Map(
      chairs.map((chair) => [chair.id, Number(chair.unitPrice)]),
    );

    return {
      ...layout,
      items: layout.items.map((item) =>
        item.kind === 'standalone_chair'
          ? {
              ...item,
              unitPrice: priceById.get(item.venueStandaloneChairId) ?? 0,
            }
          : item,
      ),
    };
  }

  private hasLegacyItemsRaw(raw: unknown): boolean {
    if (!Array.isArray(raw)) return false;
    return raw.some((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      const kind = (entry as Record<string, unknown>).kind;
      return typeof kind === 'string' && isLegacyLayoutKind(kind);
    });
  }

  private parseItems(raw: unknown): PlacedLayoutItem[] {
    const lenient = this.parseItemsLenient(raw);
    return lenient.filter(
      (item): item is PlacedLayoutItem =>
        !isLegacyLayoutKind((item as { kind: string }).kind),
    );
  }

  private parseItemsLenient(raw: unknown): PlacedLayoutItem[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const result: PlacedLayoutItem[] = [];

    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const o = entry as Record<string, unknown>;
      if (typeof o.id !== 'string' || typeof o.kind !== 'string') continue;
      if (isLegacyLayoutKind(o.kind)) continue;

      const x = Number(o.x);
      const y = Number(o.y);
      const rotation = Number(o.rotation);
      if (
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(rotation)
      ) {
        continue;
      }

      if (
        o.kind === 'standalone_chair' &&
        typeof o.venueStandaloneChairId === 'string'
      ) {
        result.push({
          id: o.id,
          kind: 'standalone_chair',
          venueStandaloneChairId: o.venueStandaloneChairId,
          chairName: STANDALONE_CHAIR_DISPLAY_LABEL,
          x,
          y,
          rotation,
        });
        continue;
      }

      if (
        o.kind === 'catalog_table' &&
        typeof o.venueTableConfigId === 'string'
      ) {
        const size = o.size as VenueTableSizeLabel;
        if (!(VENUE_TABLE_SIZES as readonly string[]).includes(size)) continue;
        result.push({
          id: o.id,
          kind: 'catalog_table',
          venueTableConfigId: o.venueTableConfigId,
          tableName: typeof o.tableName === 'string' ? o.tableName : '',
          size,
          includedChairs: Number(o.includedChairs ?? 0),
          x,
          y,
          rotation,
        });
      }
    }

    return result;
  }

  private sumChairs(items: PlacedLayoutItem[]): number {
    return items.reduce((sum, item) => sum + chairCountForItem(item), 0);
  }
}
