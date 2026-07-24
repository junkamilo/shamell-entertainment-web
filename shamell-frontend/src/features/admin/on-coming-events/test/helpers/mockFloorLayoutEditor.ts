import { vi } from "vitest";
import {
  makeFloorLayout,
  makeFloorLayoutPalette,
} from "../fixtures/onComingEvents.fixture";

export function createMockFloorLayoutEditorState(
  overrides: Record<string, unknown> = {},
) {
  const layout = makeFloorLayout();
  return {
    layoutId: layout.id,
    viewBoxWidth: layout.viewBoxWidth,
    viewBoxHeight: layout.viewBoxHeight,
    items: layout.items,
    sceneZones: layout.sceneZones,
    totalChairs: layout.totalChairs,
    palette: makeFloorLayoutPalette(),
    mode: "edit" as const,
    selectedId: null as string | null,
    dirty: false,
    loading: false,
    saving: false,
    error: null as string | null,
    hasLegacyItems: false,
    reservedLayoutItemIds: [] as string[],
    pendingLayoutItemIds: [] as string[],
    paidSeatHolders: [] as { layoutItemId: string; customerName: string }[],
    upcomingEventSlug: "gala-night",
    eventDate: "2030-08-01",
    load: vi.fn(async () => undefined),
    save: vi.fn(async () => undefined),
    setMode: vi.fn(),
    setSelectedId: vi.fn(),
    moveItem: vi.fn(),
    rotateItem: vi.fn(),
    removeItem: vi.fn(),
    clearAllItems: vi.fn(),
    placePaletteItem: vi.fn(),
    applyCashReservation: vi.fn(async () => undefined),
    sceneHandleRef: { current: null },
    ...overrides,
  };
}
