/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockFloorLayoutEditorState } from "../../test/helpers/mockFloorLayoutEditor";
import { makeFloorLayout, makeFloorLayoutPalette } from "../../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock("./FloorLayoutScene3D", () => ({
  default: () => <div data-testid="floor-layout-scene" />,
}));

vi.mock("./FloorLayoutPalette", () => ({
  default: () => <div data-testid="floor-layout-palette" />,
}));

vi.mock("./FloorLayoutToolbar", () => ({
  default: () => <div data-testid="floor-layout-toolbar" />,
}));

vi.mock("./AdminVenueReservationModal", () => ({
  default: () => null,
}));

vi.mock("../lib/usePaletteToFloorPointerDrag", () => ({
  usePaletteToFloorPointerDrag: () => ({ beginPalettePointer: vi.fn() }),
}));

function buildEditorMock(overrides: Record<string, unknown> = {}) {
  const layout = makeFloorLayout();
  const base = createMockFloorLayoutEditorState(overrides);
  return {
    sceneHandleRef: base.sceneHandleRef,
    layoutMeta: {
      id: layout.id,
      viewBoxWidth: layout.viewBoxWidth,
      viewBoxHeight: layout.viewBoxHeight,
      backgroundVersion: layout.backgroundVersion,
    },
    items: base.items,
    sceneZones: base.sceneZones,
    palette: base.palette ?? makeFloorLayoutPalette(),
    hasLegacyItems: base.hasLegacyItems,
    editorMode: base.mode ?? "edit",
    setEditorMode: base.setMode,
    selectedId: base.selectedId,
    setSelectedId: base.setSelectedId,
    dirty: base.dirty,
    loading: base.loading,
    saving: base.saving,
    error: base.error,
    reservedLayoutItemIds: base.reservedLayoutItemIds,
    reservedVenueTableConfigIds: [] as string[],
    reservedSeatShortLabels: [] as string[],
    pendingLayoutItemIds: base.pendingLayoutItemIds,
    reservedLabelsByLayoutItemId: {} as Record<string, string>,
    eventDateIso: base.eventDate ?? "2030-08-01",
    upcomingEventSlug: base.upcomingEventSlug,
    tableBundlePriceByConfigId: {} as Record<string, number>,
    itemLabels: new Map(),
    chairTotal: base.totalChairs,
    load: base.load,
    moveItem: base.moveItem,
    moveStage: vi.fn(),
    rotateSelected: vi.fn(),
    removeSelected: base.removeItem,
    clearAllItems: base.clearAllItems,
    placePaletteItem: base.placePaletteItem,
    placePaletteItemAtCenter: vi.fn(),
    save: base.save,
    onReservedItemSelect: vi.fn(),
    handlePlacedItemSelect: base.setSelectedId,
    applyCashReservation: base.applyCashReservation,
    ...overrides,
  };
}

const editorState = { current: buildEditorMock() };

vi.mock("../hooks/useFloorLayoutEditor", () => ({
  useFloorLayoutEditor: () => editorState.current,
}));

import FloorLayoutPageContent from "./FloorLayoutPageContent";

describe("FloorLayoutPageContent", () => {
  it("renders loading state", () => {
    editorState.current = buildEditorMock({ loading: true });
    renderWithProviders(<FloorLayoutPageContent />);
    expect(screen.getByText(/Loading floor layout/i)).toBeInTheDocument();
    editorState.current = buildEditorMock();
  });

  it("renders error state with retry", () => {
    editorState.current = buildEditorMock({ loading: false, error: "Could not load floor layout." });
    renderWithProviders(<FloorLayoutPageContent />);
    expect(screen.getByText(/Could not load floor layout/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    editorState.current = buildEditorMock();
  });

  it("renders toolbar, palette, and scene when loaded", () => {
    editorState.current = buildEditorMock({ loading: false, error: null });
    renderWithProviders(<FloorLayoutPageContent />);
    expect(screen.getByTestId("floor-layout-toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("floor-layout-palette")).toBeInTheDocument();
    expect(screen.getByTestId("floor-layout-scene")).toBeInTheDocument();
  });
});
