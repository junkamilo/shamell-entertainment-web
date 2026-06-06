"use client";

import { useCallback } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { useVenueSceneCanvas } from "@/components/venue-3d/VenueSceneCanvasContext";
import { pickFloorFromClient } from "./floorLayoutRaycast";
import { useFloorLayoutWindowPointerDrag } from "./useFloorLayoutWindowPointerDrag";

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
  const { getCanvas } = useVenueSceneCanvas();
  const { beginWindowPointerDrag } = useFloorLayoutWindowPointerDrag();

  const onItemPointerDown = useCallback(
    (id: string, e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      onSelect(id);

      beginWindowPointerDrag(e.nativeEvent, {
        onMove: (clientX, clientY) => {
          const canvas = getCanvas();
          if (!canvas) return;
          const layout = pickFloorFromClient(
            clientX,
            clientY,
            canvas,
            camera,
            viewBoxWidth,
            viewBoxHeight,
          );
          if (layout) onMove(id, layout.x, layout.y);
        },
      });
    },
    [
      beginWindowPointerDrag,
      camera,
      getCanvas,
      viewBoxWidth,
      viewBoxHeight,
      onMove,
      onSelect,
    ],
  );

  return { onItemPointerDown };
}
