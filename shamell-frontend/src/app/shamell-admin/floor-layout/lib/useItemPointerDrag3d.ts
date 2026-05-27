"use client";

import { useCallback, useEffect, useRef } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useVenueSceneCanvas } from "@/components/venue-3d/VenueSceneCanvasContext";
import { pickFloorFromClient } from "./floorLayoutRaycast";

type Options = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
};

export function useItemPointerDrag3d({
  viewBoxWidth,
  viewBoxHeight,
  onMove,
  onSelect,
}: Options) {
  const { camera } = useThree();
  const { getCanvas, setOrbitEnabled } = useVenueSceneCanvas();
  const activeDragId = useRef<string | null>(null);

  const unlockOrbit = useCallback(() => {
    activeDragId.current = null;
    setOrbitEnabled(true);
    document.body.style.cursor = "";
  }, [setOrbitEnabled]);

  useEffect(() => {
    return () => {
      if (activeDragId.current !== null) {
        setOrbitEnabled(true);
        document.body.style.cursor = "";
      }
    };
  }, [setOrbitEnabled]);

  const onItemPointerDown = useCallback(
    (id: string, e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.nativeEvent.preventDefault();
      e.nativeEvent.stopImmediatePropagation();

      onSelect(id);
      activeDragId.current = id;
      setOrbitEnabled(false);
      document.body.style.cursor = "grabbing";

      const onMouseMove = (ev: MouseEvent) => {
        if (activeDragId.current !== id) return;
        ev.preventDefault();
        const canvas = getCanvas();
        if (!canvas) return;
        const layout = pickFloorFromClient(
          ev.clientX,
          ev.clientY,
          canvas,
          camera,
          viewBoxWidth,
          viewBoxHeight,
        );
        if (layout) onMove(id, layout.x, layout.y);
      };

      const endDrag = () => {
        if (activeDragId.current !== id) return;
        unlockOrbit();
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", endDrag);
        window.removeEventListener("pointercancel", endDrag);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    },
    [
      camera,
      getCanvas,
      viewBoxWidth,
      viewBoxHeight,
      onMove,
      onSelect,
      setOrbitEnabled,
      unlockOrbit,
    ],
  );

  return { onItemPointerDown };
}
