export const LAYOUT_SHAPE_KINDS = [
  'catalog_table',
  'standalone_chair',
] as const;

export const VENUE_TABLE_SIZES = ['LARGE', 'MEDIUM', 'SMALL'] as const;

/** ~60% of legacy 1024 — matches frontend WORLD_WIDTH 24 (was 40). */
export const DEFAULT_VIEW_BOX_WIDTH = 614;
export const DEFAULT_VIEW_BOX_HEIGHT = 944;
export const DEFAULT_BACKGROUND_VERSION = 'v1';

export const LEGACY_LAYOUT_KINDS = [
  'big_table',
  'small_table',
  'bench',
  'chair',
  'rectangle',
  'square',
  'stage',
  'bar',
] as const;

export const FLOOR_LAYOUT_UPSERT_TX_TIMEOUT_MS = 30_000;
