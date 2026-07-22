import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { TABLE_SIZE_LABELS } from "@/components/floor-layout/layoutTypes";
import type { TableSize } from "@/features/admin/venue-tables/types/venueTables.types";

const TECHNICAL_TABLE_NAME = /^(LARGE|MEDIUM|SMALL)-[a-f0-9]{8}$/i;
const TECHNICAL_CHAIR_NAME = /^CHAIR-[a-f0-9]{8}$/i;

export type LayoutItemLabel = {
  short: string;
  full: string;
};

export type TableCatalogRow = {
  id: string;
  tableName: string;
  size: TableSize;
  sortOrder: number;
  isActive?: boolean;
};

export type ChairCatalogRow = {
  id: string;
  chairName: string;
  sortOrder: number;
  isActive?: boolean;
};

export function isTechnicalTableName(name: string): boolean {
  return TECHNICAL_TABLE_NAME.test(name.trim());
}

export function isTechnicalChairName(name: string): boolean {
  return TECHNICAL_CHAIR_NAME.test(name.trim());
}

/** Size labels stored on layout items (e.g. "Large") are not custom admin names. */
export function shouldUseTableOrdinalLabel(name: string, size: TableSize): boolean {
  const trimmed = name.trim();
  if (!trimmed || isTechnicalTableName(trimmed)) return true;
  const lower = trimmed.toLowerCase();
  const sizeLabel = TABLE_SIZE_LABELS[size].toLowerCase();
  return (
    lower === sizeLabel ||
    lower === `${sizeLabel} table` ||
    lower === size.toLowerCase()
  );
}

/** Default chair label from layout/palette ("Chair") should still get an ordinal. */
export function shouldUseChairOrdinalLabel(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || isTechnicalChairName(trimmed)) return true;
  const lower = trimmed.toLowerCase();
  return lower === "chair" || lower === "standalone chair";
}

function syntheticTableName(size: TableSize, id: string): string {
  return `${size}-${id.replace(/-/g, "").slice(0, 8)}`;
}

function syntheticChairName(id: string): string {
  return `CHAIR-${id.replace(/-/g, "").slice(0, 8)}`;
}

function enrichCatalogForLayoutLabels(
  items: readonly PlacedLayoutItem[],
  tables: readonly TableCatalogRow[],
  chairs: readonly ChairCatalogRow[],
): { tables: TableCatalogRow[]; chairs: ChairCatalogRow[] } {
  const tablesById = new Map(tables.map((t) => [t.id, t]));
  const chairsById = new Map(chairs.map((c) => [c.id, c]));

  for (const item of items) {
    if (item.kind === "catalog_table" && !tablesById.has(item.venueTableConfigId)) {
      tablesById.set(item.venueTableConfigId, {
        id: item.venueTableConfigId,
        tableName: syntheticTableName(item.size, item.venueTableConfigId),
        size: item.size,
        sortOrder: 999_999,
        isActive: true,
      });
    }
    if (
      item.kind === "standalone_chair" &&
      !chairsById.has(item.venueStandaloneChairId)
    ) {
      chairsById.set(item.venueStandaloneChairId, {
        id: item.venueStandaloneChairId,
        chairName: syntheticChairName(item.venueStandaloneChairId),
        sortOrder: 999_999,
        isActive: true,
      });
    }
  }

  return {
    tables: [...tablesById.values()],
    chairs: [...chairsById.values()],
  };
}

export function ordinalFromOrderedIds(
  orderedIds: readonly string[],
  targetId: string,
): number {
  const index = orderedIds.indexOf(targetId);
  return index >= 0 ? index + 1 : 1;
}

export function formatTableDisplayLabel(size: TableSize, ordinal: number): string {
  return `${TABLE_SIZE_LABELS[size]} table ${ordinal}`;
}

export function formatTableShortLabel(size: TableSize, ordinal: number): string {
  return `${TABLE_SIZE_LABELS[size]} ${ordinal}`;
}

export function formatChairDisplayLabel(ordinal: number): string {
  return `Chair ${ordinal}`;
}

function compareCatalogRows(
  a: { sortOrder: number; name: string },
  b: { sortOrder: number; name: string },
): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

function activeTablesBySize(tables: readonly TableCatalogRow[]): Record<TableSize, TableCatalogRow[]> {
  const grouped: Record<TableSize, TableCatalogRow[]> = {
    LARGE: [],
    MEDIUM: [],
    SMALL: [],
  };
  for (const table of tables) {
    if (table.isActive === false) continue;
    grouped[table.size].push(table);
  }
  for (const size of Object.keys(grouped) as TableSize[]) {
    grouped[size].sort((a, b) =>
      compareCatalogRows(
        { sortOrder: a.sortOrder, name: a.tableName },
        { sortOrder: b.sortOrder, name: b.tableName },
      ),
    );
  }
  return grouped;
}

function activeChairsOrdered(chairs: readonly ChairCatalogRow[]): ChairCatalogRow[] {
  return chairs
    .filter((c) => c.isActive !== false)
    .sort((a, b) =>
      compareCatalogRows(
        { sortOrder: a.sortOrder, name: a.chairName },
        { sortOrder: b.sortOrder, name: b.chairName },
      ),
    );
}

export function resolveTableDisplayLabels(
  table: TableCatalogRow,
  allTables: readonly TableCatalogRow[],
): LayoutItemLabel {
  const customName = table.tableName?.trim();
  if (customName && !shouldUseTableOrdinalLabel(customName, table.size)) {
    return { short: customName, full: customName };
  }
  const peers = activeTablesBySize(allTables)[table.size];
  const ordinal = ordinalFromOrderedIds(
    peers.map((row) => row.id),
    table.id,
  );
  return {
    short: formatTableShortLabel(table.size, ordinal),
    full: formatTableDisplayLabel(table.size, ordinal),
  };
}

export function resolveChairDisplayLabels(
  chair: ChairCatalogRow,
  allChairs: readonly ChairCatalogRow[],
): LayoutItemLabel {
  const customName = chair.chairName?.trim();
  if (customName && !shouldUseChairOrdinalLabel(customName)) {
    return { short: customName, full: customName };
  }
  const peers = activeChairsOrdered(allChairs);
  const ordinal = ordinalFromOrderedIds(
    peers.map((row) => row.id),
    chair.id,
  );
  const label = formatChairDisplayLabel(ordinal);
  return { short: label, full: label };
}

export function buildLayoutItemLabelMap(
  items: readonly PlacedLayoutItem[],
  tables: readonly TableCatalogRow[],
  chairs: readonly ChairCatalogRow[],
): ReadonlyMap<string, LayoutItemLabel> {
  const enriched = enrichCatalogForLayoutLabels(items, tables, chairs);
  const tablesById = new Map(enriched.tables.map((t) => [t.id, t]));
  const chairsById = new Map(enriched.chairs.map((c) => [c.id, c]));
  const tablesBySize = activeTablesBySize(enriched.tables);
  const orderedChairs = activeChairsOrdered(enriched.chairs);

  const map = new Map<string, LayoutItemLabel>();

  for (const item of items) {
    if (item.kind === "catalog_table") {
      const table = tablesById.get(item.venueTableConfigId);
      if (!table) continue;
      const customName = table.tableName?.trim();
      if (customName && !shouldUseTableOrdinalLabel(customName, table.size)) {
        map.set(item.id, { short: customName, full: customName });
        continue;
      }
      const peers = tablesBySize[table.size];
      const ordinal = ordinalFromOrderedIds(
        peers.map((row) => row.id),
        table.id,
      );
      map.set(item.id, {
        short: formatTableShortLabel(table.size, ordinal),
        full: formatTableDisplayLabel(table.size, ordinal),
      });
      continue;
    }

    const chair = chairsById.get(item.venueStandaloneChairId);
    if (!chair) continue;
    const customName = chair.chairName?.trim();
    if (customName && !shouldUseChairOrdinalLabel(customName)) {
      map.set(item.id, { short: customName, full: customName });
      continue;
    }
    const ordinal = ordinalFromOrderedIds(
      orderedChairs.map((row) => row.id),
      chair.id,
    );
    const label = formatChairDisplayLabel(ordinal);
    map.set(item.id, { short: label, full: label });
  }

  return map;
}
