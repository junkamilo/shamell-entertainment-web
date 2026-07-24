/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { makeFloorLayout } from "../../test/fixtures/onComingEvents.fixture";

vi.mock("@react-three/fiber", () => ({
  useThree: () => ({ camera: {} }),
}));

vi.mock("@/components/venue-3d/VenueSceneCanvasContext", () => ({
  useVenueSceneCanvas: () => ({
    getCanvas: () => null,
    setOrbitEnabled: vi.fn(),
  }),
}));

vi.mock("../lib/useFloorLayoutWindowPointerDrag", () => ({
  useFloorLayoutWindowPointerDrag: () => ({
    beginWindowPointerDrag: vi.fn(),
    endDrag: vi.fn(),
    isDragging: () => false,
  }),
}));

import SceneDecorEditorLayer from "./SceneDecorEditorLayer";

describe("SceneDecorEditorLayer", () => {
  it("exports a component function", () => {
    expect(typeof SceneDecorEditorLayer).toBe("function");
  });

  it("can be invoked as a React component type", () => {
    const layout = makeFloorLayout();
    expect(
      SceneDecorEditorLayer({
        sceneZones: layout.sceneZones,
        selectedId: null,
        onSelect: vi.fn(),
        onMoveStage: vi.fn(),
      }),
    ).toBeTruthy();
  });
});
