/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import { makeFloorLayout } from "../../test/fixtures/onComingEvents.fixture";
import { SCENE_STAGE_SELECT_ID } from "@/components/venue-3d";

const { beginWindowPointerDrag, getCanvas, pickWorld } = vi.hoisted(() => ({
  beginWindowPointerDrag: vi.fn(),
  getCanvas: vi.fn((): HTMLCanvasElement | null => null),
  pickWorld: vi.fn((): { x: number; z: number } | null => null),
}));

vi.mock("@react-three/fiber", () => ({
  useThree: () => ({ camera: { name: "mock-camera" } }),
}));

vi.mock("@/components/venue-3d", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/venue-3d")>();
  return {
    ...actual,
    useVenueSceneCanvas: () => ({
      getCanvas,
      setOrbitEnabled: vi.fn(),
    }),
  };
});

vi.mock("../lib/useFloorLayoutWindowPointerDrag", () => ({
  useFloorLayoutWindowPointerDrag: () => ({
    beginWindowPointerDrag,
    endDrag: vi.fn(),
    isDragging: () => false,
  }),
}));

vi.mock("../lib/floorLayoutRaycast", () => ({
  pickWorldFromClient: (
    clientX: number,
    clientY: number,
    canvas: HTMLCanvasElement,
    camera: unknown,
  ) => pickWorld(clientX, clientY, canvas, camera),
}));

import SceneDecorEditorLayer from "./SceneDecorEditorLayer";

function hitMesh(container: HTMLElement) {
  return container.querySelector('[data-r3f="mesh"]') as HTMLElement;
}

function renderLayer(selectedId: string | null = null) {
  const onSelect = vi.fn();
  const onMoveStage = vi.fn();
  const layout = makeFloorLayout();
  const view = render(
    <SceneDecorEditorLayer
      sceneZones={layout.sceneZones}
      selectedId={selectedId}
      onSelect={onSelect}
      onMoveStage={onMoveStage}
    />,
  );
  return { ...view, onSelect, onMoveStage };
}

describe("SceneDecorEditorLayer", () => {
  beforeEach(() => {
    beginWindowPointerDrag.mockReset();
    getCanvas.mockReset();
    getCanvas.mockReturnValue(null);
    pickWorld.mockReset();
    pickWorld.mockReturnValue(null);
  });

  it("renders a hit mesh without a selection outline", () => {
    const { container } = renderLayer(null);
    expect(container.querySelectorAll('[data-r3f="mesh"]')).toHaveLength(1);
  });

  it("renders a selection outline when the stage is selected", () => {
    const { container } = renderLayer(SCENE_STAGE_SELECT_ID);
    expect(container.querySelectorAll('[data-r3f="mesh"]')).toHaveLength(2);
  });

  it("selects the stage on click", () => {
    const { container, onSelect } = renderLayer(null);
    fireEvent.click(hitMesh(container));
    expect(onSelect).toHaveBeenCalledWith(SCENE_STAGE_SELECT_ID);
  });

  it("ignores non-primary pointer down", () => {
    const { container, onSelect } = renderLayer(null);
    fireEvent.pointerDown(hitMesh(container), { button: 2 });
    expect(onSelect).not.toHaveBeenCalled();
    expect(beginWindowPointerDrag).not.toHaveBeenCalled();
  });

  it("selects and starts a drag on primary pointer down", () => {
    const { container, onSelect } = renderLayer(null);
    fireEvent.pointerDown(hitMesh(container), { button: 0 });
    expect(onSelect).toHaveBeenCalledWith(SCENE_STAGE_SELECT_ID);
    expect(beginWindowPointerDrag).toHaveBeenCalled();
  });

  it("does not move the stage when the canvas is missing", () => {
    const { container, onMoveStage } = renderLayer(null);
    fireEvent.pointerDown(hitMesh(container), { button: 0 });
    const opts = beginWindowPointerDrag.mock.calls[0]![1] as {
      onMove: (x: number, y: number) => void;
    };
    opts.onMove(10, 20);
    expect(onMoveStage).not.toHaveBeenCalled();
  });

  it("does not move the stage when the raycast misses", () => {
    const canvas = document.createElement("canvas");
    getCanvas.mockReturnValue(canvas);
    pickWorld.mockReturnValue(null);
    const { container, onMoveStage } = renderLayer(null);
    fireEvent.pointerDown(hitMesh(container), { button: 0 });
    const opts = beginWindowPointerDrag.mock.calls[0]![1] as {
      onMove: (x: number, y: number) => void;
    };
    opts.onMove(10, 20);
    expect(pickWorld).toHaveBeenCalledWith(
      10,
      20,
      canvas,
      expect.objectContaining({ name: "mock-camera" }),
    );
    expect(onMoveStage).not.toHaveBeenCalled();
  });

  it("moves the stage when the raycast hits", () => {
    const canvas = document.createElement("canvas");
    getCanvas.mockReturnValue(canvas);
    pickWorld.mockReturnValue({ x: 4, z: -2 });
    const { container, onMoveStage } = renderLayer(null);
    fireEvent.pointerDown(hitMesh(container), { button: 0 });
    const opts = beginWindowPointerDrag.mock.calls[0]![1] as {
      onMove: (x: number, y: number) => void;
    };
    opts.onMove(12, 8);
    expect(onMoveStage).toHaveBeenCalledWith(4, -2);
  });
});
