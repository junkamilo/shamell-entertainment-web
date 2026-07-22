"use client";

import { useCallback, useEffect, useRef } from "react";
import { useVenueSceneCanvas } from "@/components/venue-3d/VenueSceneCanvasContext";

type DragCallbacks = {
  onMove: (clientX: number, clientY: number) => void;
  onEnd?: () => void;
};

type BeginOptions = DragCallbacks & {
  cursor?: string;
};

/**
 * Window-level pointer drag for the 3D floor layout editor.
 * Uses non-passive pointermove listeners so preventDefault works on touch/pen.
 * Never call preventDefault on R3F ThreeEvent handlers — use this hook instead.
 */
export function useFloorLayoutWindowPointerDrag() {
  const { getCanvas, setOrbitEnabled } = useVenueSceneCanvas();
  const activePointerId = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const endDrag = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    activePointerId.current = null;
    setOrbitEnabled(true);
    document.body.style.cursor = "";
  }, [setOrbitEnabled]);

  useEffect(() => {
    return () => {
      endDrag();
    };
  }, [endDrag]);

  const beginWindowPointerDrag = useCallback(
    (nativeEvent: PointerEvent, { onMove, onEnd, cursor = "grabbing" }: BeginOptions) => {
      if (activePointerId.current !== null) return;

      const pointerId = nativeEvent.pointerId;
      activePointerId.current = pointerId;
      setOrbitEnabled(false);
      document.body.style.cursor = cursor;

      const canvas = getCanvas();
      if (canvas) {
        try {
          canvas.setPointerCapture(pointerId);
        } catch {
          // iOS may reject capture in edge cases; window listeners still work.
        }
      }

      const onPointerMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        ev.preventDefault();
        onMove(ev.clientX, ev.clientY);
      };

      const finish = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        if (canvas) {
          try {
            if (canvas.hasPointerCapture(pointerId)) {
              canvas.releasePointerCapture(pointerId);
            }
          } catch {
            // ignore
          }
        }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        window.removeEventListener("lostpointercapture", finish);
        activePointerId.current = null;
        cleanupRef.current = null;
        setOrbitEnabled(true);
        document.body.style.cursor = "";
        onEnd?.();
      };

      window.addEventListener("pointermove", onPointerMove, { passive: false });
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", finish);
      window.addEventListener("lostpointercapture", finish);

      cleanupRef.current = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        window.removeEventListener("lostpointercapture", finish);
      };
    },
    [getCanvas, setOrbitEnabled],
  );

  const isDragging = useCallback(() => activePointerId.current !== null, []);

  return { beginWindowPointerDrag, endDrag, isDragging };
}
