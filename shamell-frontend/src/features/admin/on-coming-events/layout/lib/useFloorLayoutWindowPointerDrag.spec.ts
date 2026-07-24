/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFloorLayoutWindowPointerDrag } from "./useFloorLayoutWindowPointerDrag";

vi.mock("@/components/venue-3d/VenueSceneCanvasContext", () => ({
  useVenueSceneCanvas: () => ({
    getCanvas: () => null,
    setOrbitEnabled: vi.fn(),
  }),
}));

describe("useFloorLayoutWindowPointerDrag", () => {
  it("returns drag helpers without throwing", () => {
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    expect(typeof result.current.beginWindowPointerDrag).toBe("function");
    expect(typeof result.current.endDrag).toBe("function");
    expect(typeof result.current.isDragging).toBe("function");
    expect(result.current.isDragging()).toBe(false);
  });
});
