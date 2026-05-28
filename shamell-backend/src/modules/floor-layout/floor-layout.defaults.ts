export const LAYOUT_SHAPE_KINDS = ['catalog_table', 'standalone_chair'] as const;

export type LayoutShapeKind = (typeof LAYOUT_SHAPE_KINDS)[number];

export const VENUE_TABLE_SIZES = ['LARGE', 'MEDIUM', 'SMALL'] as const;
export type VenueTableSizeLabel = (typeof VENUE_TABLE_SIZES)[number];

export type PlacedLayoutItem =
  | {
      id: string;
      kind: 'catalog_table';
      venueTableConfigId: string;
      tableName: string;
      size: VenueTableSizeLabel;
      includedChairs: number;
      x: number;
      y: number;
      rotation: number;
    }
  | {
      id: string;
      kind: 'standalone_chair';
      venueStandaloneChairId: string;
      chairName: string;
      x: number;
      y: number;
      rotation: number;
    };

export const DEFAULT_VIEW_BOX_WIDTH = 1024;
export const DEFAULT_VIEW_BOX_HEIGHT = 944;
export const DEFAULT_BACKGROUND_VERSION = 'v1';

const LEGACY_KINDS = [
  'big_table',
  'small_table',
  'bench',
  'chair',
  'rectangle',
  'square',
  'stage',
  'bar',
] as const;

export function isLegacyLayoutKind(kind: string): boolean {
  return (LEGACY_KINDS as readonly string[]).includes(kind);
}

export function chairCountForItem(item: PlacedLayoutItem): number {
  if (item.kind === 'catalog_table') return item.includedChairs;
  return 1;
}

export function getDefaultLayoutItems(): PlacedLayoutItem[] {
  return [];
}
