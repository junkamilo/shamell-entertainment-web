/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useItemPointerDrag3d } from "./useItemPointerDrag3d";

vi.mock("@react-three/fiber", () => ({
  useThree: () => ({ camera: {} }),
}));

vi.mock("@/components/venue-3d/VenueSceneCanvasContext", () => ({
  useVenueSceneCanvas: () => ({
    getCanvas: () => null,
    setOrbitEnabled: vi.fn(),
  }),
}));

vi.mock("./useFloorLayoutWindowPointerDrag", () => ({
  useFloorLayoutWindowPointerDrag: () => ({
    beginWindowPointerDrag: vi.fn(),
    endDrag: vi.fn(),
    isDragging: () => false,
  }),
}));

describe("useItemPointerDrag3d", () => {
  it("returns onItemPointerDown handler", () => {
    const { result } = renderHook(() =>
      useItemPointerDrag3d({
        viewBoxWidth: 614,
        viewBoxHeight: 944,
        onMove: vi.fn(),
        onSelect: vi.fn(),
      }),
    );
    expect(typeof result.current.onItemPointerDown).toBe("function");
  });
});
