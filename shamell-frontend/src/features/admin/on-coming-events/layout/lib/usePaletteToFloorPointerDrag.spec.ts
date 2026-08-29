/** @vitest-environment jsdom */

import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import type { Camera } from "three";
import { usePaletteToFloorPointerDrag } from "./usePaletteToFloorPointerDrag";
import type { PaletteDragKind } from "../hooks/useFloorLayoutEditor";

const pickFloorFromClient = vi.hoisted(() => vi.fn());

vi.mock("./floorLayoutRaycast", () => ({
  pickFloorFromClient: (...args: unknown[]) => pickFloorFromClient(...args),
}));

const DRAG: PaletteDragKind = { type: "chair" };

function pointer(
  type: string,
  init: PointerEventInit = {},
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    button: 0,
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    ...init,
  });
}

function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    left: 0,
    right: 200,
    top: 0,
    bottom: 200,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect);
}

function setup(overrides: Record<string, unknown> = {}) {
  const setOrbitEnabled = vi.fn();
  const getCanvas = vi.fn(() => document.createElement("canvas"));
  const getCamera = vi.fn(() => ({ isCamera: true }) as unknown as Camera);
  const container = document.createElement("div");
  mockRect(container, {});
  const sceneHandleRef = {
    current: { setOrbitEnabled, getCanvas, getCamera },
  };
  const canvasContainerRef = { current: container as HTMLElement | null };
  const onDrop = vi.fn();
  const onTap = vi.fn();
  const onGhostChange = vi.fn();
  const onDragOverCanvas = vi.fn();

  const hook = renderHook(() =>
    usePaletteToFloorPointerDrag({
      sceneHandleRef,
      canvasContainerRef,
      viewBoxWidth: 614,
      viewBoxHeight: 944,
      onDrop,
      onTap,
      onGhostChange,
      onDragOverCanvas,
      ...overrides,
    }),
  );

  return {
    ...hook,
    setOrbitEnabled,
    getCanvas,
    getCamera,
    container,
    canvasContainerRef,
    sceneHandleRef,
    onDrop,
    onTap,
    onGhostChange,
    onDragOverCanvas,
  };
}

describe("usePaletteToFloorPointerDrag", () => {
  afterEach(() => {
    pickFloorFromClient.mockReset();
  });

  it("ignores non-primary buttons", () => {
    const { result, onTap } = setup();
    result.current.beginPalettePointer(pointer("pointerdown", { button: 2 }), DRAG, "Chair");
    window.dispatchEvent(pointer("pointerup"));
    expect(onTap).not.toHaveBeenCalled();
  });

  it("ignores a second begin while a pointer session is active", () => {
    const { result, onTap } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    result.current.beginPalettePointer(
      pointer("pointerdown", { pointerId: 2 }),
      DRAG,
      "Chair",
    );
    window.dispatchEvent(pointer("pointerup"));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("taps when the pointer is released before the drag threshold", () => {
    const { result, onTap, onGhostChange, onDragOverCanvas, setOrbitEnabled } =
      setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 104, clientY: 104 }));
    window.dispatchEvent(pointer("pointerup"));
    expect(onTap).toHaveBeenCalledWith(DRAG);
    expect(onGhostChange).toHaveBeenCalledWith(null);
    expect(onDragOverCanvas).toHaveBeenCalledWith(false);
    expect(setOrbitEnabled).toHaveBeenCalledWith(true);
  });

  it("treats a mostly-horizontal move as a scroll gesture", () => {
    const { result, onTap, onDrop, onGhostChange } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 130, clientY: 102 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 140, clientY: 102 }));
    window.dispatchEvent(pointer("pointerup"));
    expect(onTap).not.toHaveBeenCalled();
    expect(onDrop).not.toHaveBeenCalled();
    expect(onGhostChange).toHaveBeenCalledWith(null);
  });

  it("ignores pointermove and pointerup from another pointer id", () => {
    const { result, onTap, onGhostChange } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(
      pointer("pointermove", { pointerId: 9, clientX: 100, clientY: 140 }),
    );
    window.dispatchEvent(pointer("pointerup", { pointerId: 9 }));
    expect(onTap).not.toHaveBeenCalled();
    expect(onGhostChange).not.toHaveBeenCalled();
    window.dispatchEvent(pointer("pointerup"));
    expect(onTap).toHaveBeenCalledWith(DRAG);
  });

  it("starts a vertical drag, updates the ghost, and drops on the floor", () => {
    pickFloorFromClient.mockReturnValue({ x: 12, y: 34 });
    const { result, onDrop, onTap, onGhostChange, onDragOverCanvas, setOrbitEnabled } =
      setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair 1");
    const move = pointer("pointermove", { clientX: 110, clientY: 140 });
    const prevent = vi.spyOn(move, "preventDefault");
    window.dispatchEvent(move);
    expect(setOrbitEnabled).toHaveBeenCalledWith(false);
    expect(prevent).toHaveBeenCalled();
    expect(onGhostChange).toHaveBeenCalledWith({
      drag: DRAG,
      x: 110,
      y: 140,
      label: "Chair 1",
    });
    expect(onDragOverCanvas).toHaveBeenCalledWith(true);

    window.dispatchEvent(pointer("pointerup", { clientX: 110, clientY: 140 }));
    expect(onTap).not.toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalledWith(DRAG, 12, 34);
  });

  it("does not drop when the pointer is outside the canvas rect", () => {
    pickFloorFromClient.mockReturnValue({ x: 1, y: 2 });
    const { result, onDrop } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    window.dispatchEvent(pointer("pointerup", { clientX: 400, clientY: 400 }));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("does not drop when the raycast misses", () => {
    pickFloorFromClient.mockReturnValue(null);
    const { result, onDrop } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    window.dispatchEvent(pointer("pointerup", { clientX: 110, clientY: 140 }));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("does not drop without canvas or camera", () => {
    const { result, onDrop, getCanvas, getCamera } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    getCanvas.mockReturnValue(null);
    window.dispatchEvent(pointer("pointerup", { clientX: 110, clientY: 140 }));
    expect(onDrop).not.toHaveBeenCalled();

    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    getCanvas.mockReturnValue(document.createElement("canvas"));
    getCamera.mockReturnValue(null);
    window.dispatchEvent(pointer("pointerup", { clientX: 110, clientY: 140 }));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("does not drop without a canvas container", () => {
    const { result, onDrop, canvasContainerRef } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    canvasContainerRef.current = null;
    window.dispatchEvent(pointer("pointerup", { clientX: 110, clientY: 140 }));
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("skips hover updates when the container is missing during a drag", () => {
    const { result, canvasContainerRef, onDragOverCanvas } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    canvasContainerRef.current = null;
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    expect(onDragOverCanvas).not.toHaveBeenCalledWith(true);
    window.dispatchEvent(pointer("pointercancel", { clientX: 100, clientY: 140 }));
  });

  it("reports hover false when the pointer is outside the rect", () => {
    const { result, onDragOverCanvas } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    window.dispatchEvent(pointer("pointermove", { clientX: -10, clientY: 140 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 250, clientY: 100 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: -5 }));
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 250 }));
    expect(onDragOverCanvas).toHaveBeenCalledWith(false);
    window.dispatchEvent(pointer("pointerup", { clientX: -10, clientY: 140 }));
  });

  it("works without onDragOverCanvas and with a null scene handle", () => {
    const { result, unmount } = setup({
      onDragOverCanvas: undefined,
      sceneHandleRef: { current: null },
    });
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    window.dispatchEvent(pointer("pointermove", { clientX: 100, clientY: 140 }));
    window.dispatchEvent(pointer("pointerup", { clientX: 110, clientY: 140 }));
    expect(() => unmount()).not.toThrow();
  });

  it("ends the session on unmount", () => {
    const { result, unmount, onGhostChange } = setup();
    result.current.beginPalettePointer(pointer("pointerdown"), DRAG, "Chair");
    unmount();
    expect(onGhostChange).toHaveBeenCalledWith(null);
  });

  it("unmounts cleanly without an active pointer session", () => {
    const { unmount, onGhostChange } = setup();
    unmount();
    expect(onGhostChange).toHaveBeenCalledWith(null);
  });
});
