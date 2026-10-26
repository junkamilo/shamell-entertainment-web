/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeFloorLayout } from "@test/features/admin/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/admin/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/components/venue-3d", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/venue-3d")>();
  return {
    ...actual,
    useVenueSceneLayout: () => ({
      bucket: "desktop",
      dpr: 1,
      perfProfile: "balanced",
    }),
    VenueScene3D: () => <div data-testid="venue-scene-3d" />,
  };
});

vi.mock("@/features/admin/on-coming-events/layout/components/PlacedItemsLayer3d", () => ({
  default: () => <div data-testid="placed-items-layer" />,
}));

vi.mock("@/features/admin/on-coming-events/layout/components/SceneDecorEditorLayer", () => ({
  default: () => <div data-testid="scene-decor-layer" />,
}));

vi.mock("@/features/admin/on-coming-events/layout/components/FloorLayoutEditorActions", () => ({
  default: () => <div data-testid="editor-actions" />,
  sceneSelectionLabel: (id: string | null) => (id ? "Tarima" : null),
}));

import FloorLayoutScene3D from "@/features/admin/on-coming-events/layout/components/FloorLayoutScene3D";

describe("FloorLayoutScene3D", () => {
  it("renders mocked VenueScene3D shell", () => {
    const layout = makeFloorLayout();
    renderWithProviders(
      <FloorLayoutScene3D
        viewBoxWidth={layout.viewBoxWidth}
        viewBoxHeight={layout.viewBoxHeight}
        items={layout.items}
        sceneZones={layout.sceneZones}
        selectedId={null}
        sceneHandleRef={{ current: null }}
        canvasContainerRef={{ current: null }}
        onSelect={vi.fn()}
        onMoveItem={vi.fn()}
        onMoveStage={vi.fn()}
        dirty={false}
        saving={false}
        onSave={vi.fn()}
        onRotateLeft={vi.fn()}
        onRotateRight={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    expect(screen.getByTestId("editor-actions")).toBeInTheDocument();
  });
});
