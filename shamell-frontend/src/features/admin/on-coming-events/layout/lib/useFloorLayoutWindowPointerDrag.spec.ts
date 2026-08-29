/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useFloorLayoutWindowPointerDrag } from "./useFloorLayoutWindowPointerDrag";

const { getCanvas, setOrbitEnabled } = vi.hoisted(() => ({
  getCanvas: vi.fn((): HTMLCanvasElement | null => null),
  setOrbitEnabled: vi.fn(),
}));

vi.mock("@/components/venue-3d", () => ({
  useVenueSceneCanvas: () => ({
    getCanvas,
    setOrbitEnabled,
  }),
}));

function pointer(type: string, init: PointerEventInit = {}): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    pointerId: 1,
    clientX: 40,
    clientY: 50,
    ...init,
  });
}

function mockCanvas(overrides: Partial<HTMLCanvasElement> = {}) {
  const canvas = document.createElement("canvas");
  canvas.setPointerCapture = vi.fn();
  canvas.releasePointerCapture = vi.fn();
  canvas.hasPointerCapture = vi.fn(() => false);
  Object.assign(canvas, overrides);
  return canvas;
}

describe("useFloorLayoutWindowPointerDrag", () => {
  beforeEach(() => {
    getCanvas.mockReset();
    getCanvas.mockReturnValue(null);
    setOrbitEnabled.mockReset();
    document.body.style.cursor = "";
  });

  it("returns drag helpers while idle", () => {
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    expect(result.current.isDragging()).toBe(false);
    result.current.endDrag();
    expect(setOrbitEnabled).toHaveBeenCalledWith(true);
  });

  it("ignores a second begin while a drag is active", () => {
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    const onMove = vi.fn();
    result.current.beginWindowPointerDrag(pointer("pointerdown"), { onMove });
    result.current.beginWindowPointerDrag(
      pointer("pointerdown", { pointerId: 2 }),
      { onMove },
    );
    expect(result.current.isDragging()).toBe(true);
    expect(setOrbitEnabled).toHaveBeenCalledTimes(1);
    expect(setOrbitEnabled).toHaveBeenCalledWith(false);
    window.dispatchEvent(pointer("pointerup"));
  });

  it("moves with preventDefault and finishes with onEnd", () => {
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    const onMove = vi.fn();
    const onEnd = vi.fn();
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove,
      onEnd,
      cursor: "move",
    });
    expect(document.body.style.cursor).toBe("move");

    window.dispatchEvent(pointer("pointermove", { pointerId: 9, clientX: 1, clientY: 1 }));
    expect(onMove).not.toHaveBeenCalled();

    const move = pointer("pointermove", { clientX: 12, clientY: 34 });
    const prevent = vi.spyOn(move, "preventDefault");
    window.dispatchEvent(move);
    expect(prevent).toHaveBeenCalled();
    expect(onMove).toHaveBeenCalledWith(12, 34);

    window.dispatchEvent(pointer("pointerup", { pointerId: 9 }));
    expect(onEnd).not.toHaveBeenCalled();

    window.dispatchEvent(pointer("pointerup"));
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isDragging()).toBe(false);
    expect(setOrbitEnabled).toHaveBeenCalledWith(true);
    expect(document.body.style.cursor).toBe("");
  });

  it("uses grabbing cursor by default and captures the canvas pointer", () => {
    const canvas = mockCanvas();
    getCanvas.mockReturnValue(canvas);
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove: vi.fn(),
    });
    expect(document.body.style.cursor).toBe("grabbing");
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    window.dispatchEvent(pointer("pointercancel"));
  });

  it("ignores setPointerCapture failures", () => {
    const canvas = mockCanvas();
    canvas.setPointerCapture = vi.fn(() => {
      throw new Error("ios");
    });
    getCanvas.mockReturnValue(canvas);
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    expect(() =>
      result.current.beginWindowPointerDrag(pointer("pointerdown"), {
        onMove: vi.fn(),
      }),
    ).not.toThrow();
    window.dispatchEvent(pointer("pointerup"));
  });

  it("releases pointer capture on finish when captured", () => {
    const canvas = mockCanvas();
    canvas.hasPointerCapture = vi.fn(() => true);
    getCanvas.mockReturnValue(canvas);
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove: vi.fn(),
    });
    window.dispatchEvent(pointer("pointerup"));
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it("skips release when the canvas does not have capture", () => {
    const canvas = mockCanvas();
    canvas.hasPointerCapture = vi.fn(() => false);
    getCanvas.mockReturnValue(canvas);
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove: vi.fn(),
    });
    window.dispatchEvent(pointer("lostpointercapture"));
    expect(canvas.releasePointerCapture).not.toHaveBeenCalled();
  });

  it("ignores releasePointerCapture failures", () => {
    const canvas = mockCanvas();
    canvas.hasPointerCapture = vi.fn(() => true);
    canvas.releasePointerCapture = vi.fn(() => {
      throw new Error("release");
    });
    getCanvas.mockReturnValue(canvas);
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove: vi.fn(),
    });
    expect(() => window.dispatchEvent(pointer("pointerup"))).not.toThrow();
  });

  it("endDrag removes listeners mid-session", () => {
    const { result } = renderHook(() => useFloorLayoutWindowPointerDrag());
    const onMove = vi.fn();
    const onEnd = vi.fn();
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove,
      onEnd,
    });
    expect(result.current.isDragging()).toBe(true);
    result.current.endDrag();
    expect(result.current.isDragging()).toBe(false);
    window.dispatchEvent(pointer("pointermove", { clientX: 9, clientY: 9 }));
    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).not.toHaveBeenCalled();
  });

  it("ends the drag on unmount", () => {
    const { result, unmount } = renderHook(() => useFloorLayoutWindowPointerDrag());
    result.current.beginWindowPointerDrag(pointer("pointerdown"), {
      onMove: vi.fn(),
    });
    unmount();
    expect(setOrbitEnabled).toHaveBeenCalledWith(true);
  });
});
