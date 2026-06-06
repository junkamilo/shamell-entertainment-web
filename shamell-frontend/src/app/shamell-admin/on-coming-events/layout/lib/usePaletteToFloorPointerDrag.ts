"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { VenueScene3DHandle } from "@/components/venue-3d/VenueScene3D";
import type { PaletteDragKind } from "../hooks/useFloorLayoutEditor";
import { pickFloorFromClient } from "./floorLayoutRaycast";

const DRAG_THRESHOLD_PX = 8;

export type PaletteDragGhost = {
  drag: PaletteDragKind;
  x: number;
  y: number;
  label: string;
};

type Options = {
  sceneHandleRef: RefObject<VenueScene3DHandle | null>;
  canvasContainerRef: RefObject<HTMLElement | null>;
  viewBoxWidth: number;
  viewBoxHeight: number;
  onDrop: (drag: PaletteDragKind, x: number, y: number) => void;
  onTap: (drag: PaletteDragKind) => void;
  onGhostChange: (ghost: PaletteDragGhost | null) => void;
  onDragOverCanvas?: (isOver: boolean) => void;
};

function isOverRect(clientX: number, clientY: number, rect: DOMRect) {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

export function usePaletteToFloorPointerDrag({
  sceneHandleRef,
  canvasContainerRef,
  viewBoxWidth,
  viewBoxHeight,
  onDrop,
  onTap,
  onGhostChange,
  onDragOverCanvas,
}: Options) {
  const activePointerId = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const endSession = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    activePointerId.current = null;
    onGhostChange(null);
    onDragOverCanvas?.(false);
    sceneHandleRef.current?.setOrbitEnabled(true);
  }, [onDragOverCanvas, onGhostChange, sceneHandleRef]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  const beginPalettePointer = useCallback(
    (
      nativeEvent: PointerEvent,
      drag: PaletteDragKind,
      label: string,
    ) => {
      if (nativeEvent.button !== 0) return;
      if (activePointerId.current !== null) return;

      const pointerId = nativeEvent.pointerId;
      const startX = nativeEvent.clientX;
      const startY = nativeEvent.clientY;
      let isDragging = false;
      let isScrollGesture = false;

      activePointerId.current = pointerId;

      const onPointerMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;

        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!isDragging && !isScrollGesture) {
          if (Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) {
            return;
          }
          if (Math.abs(dx) > Math.abs(dy)) {
            isScrollGesture = true;
            endSession();
            return;
          }
          isDragging = true;
          sceneHandleRef.current?.setOrbitEnabled(false);
        }

        if (!isDragging) return;

        ev.preventDefault();
        onGhostChange({ drag, x: ev.clientX, y: ev.clientY, label });

        const container = canvasContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          onDragOverCanvas?.(isOverRect(ev.clientX, ev.clientY, rect));
        }
      };

      const finish = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;

        if (isScrollGesture) {
          endSession();
          return;
        }

        if (!isDragging) {
          onTap(drag);
          endSession();
          return;
        }

        const container = canvasContainerRef.current;
        const scene = sceneHandleRef.current;
        const canvas = scene?.getCanvas() ?? null;
        const camera = scene?.getCamera() ?? null;

        if (container && canvas && camera) {
          const rect = container.getBoundingClientRect();
          if (isOverRect(ev.clientX, ev.clientY, rect)) {
            const picked = pickFloorFromClient(
              ev.clientX,
              ev.clientY,
              canvas,
              camera,
              viewBoxWidth,
              viewBoxHeight,
            );
            if (picked) {
              onDrop(drag, picked.x, picked.y);
            }
          }
        }

        endSession();
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);

      cleanupRef.current = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
      };
    },
    [
      canvasContainerRef,
      endSession,
      onDragOverCanvas,
      onDrop,
      onGhostChange,
      onTap,
      sceneHandleRef,
      viewBoxHeight,
      viewBoxWidth,
    ],
  );

  return { beginPalettePointer };
}
