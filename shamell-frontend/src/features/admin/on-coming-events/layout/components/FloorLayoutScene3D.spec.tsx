/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeFloorLayout } from "../../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("@/components/venue-3d/useVenueSceneLayout", () => ({
  useVenueSceneLayout: () => ({
    bucket: "desktop",
    dpr: 1,
    perfProfile: "balanced",
  }),
}));

vi.mock("@/components/venue-3d/VenueScene3D", () => ({
  default: () => <div data-testid="venue-scene-3d" />,
}));

vi.mock("./PlacedItemsLayer3d", () => ({
  default: () => <div data-testid="placed-items-layer" />,
}));

vi.mock("./SceneDecorEditorLayer", () => ({
  default: () => <div data-testid="scene-decor-layer" />,
}));

vi.mock("./FloorLayoutEditorActions", () => ({
  default: () => <div data-testid="editor-actions" />,
  sceneSelectionLabel: (id: string | null) => (id ? "Tarima" : null),
}));

import FloorLayoutScene3D from "./FloorLayoutScene3D";

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
