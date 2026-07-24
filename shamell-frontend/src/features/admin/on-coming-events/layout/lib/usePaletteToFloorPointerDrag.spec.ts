/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePaletteToFloorPointerDrag } from "./usePaletteToFloorPointerDrag";

describe("usePaletteToFloorPointerDrag", () => {
  it("returns beginPalettePointer without throwing", () => {
    const sceneHandleRef = { current: { setOrbitEnabled: vi.fn(), getCanvas: () => null, getCamera: () => null } };
    const canvasContainerRef = { current: document.createElement("div") };
    const { result } = renderHook(() =>
      usePaletteToFloorPointerDrag({
        sceneHandleRef,
        canvasContainerRef,
        viewBoxWidth: 614,
        viewBoxHeight: 944,
        onDrop: vi.fn(),
        onTap: vi.fn(),
        onGhostChange: vi.fn(),
      }),
    );
    expect(typeof result.current.beginPalettePointer).toBe("function");
  });
});
