import { useCallback, useRef, type RefObject, type MouseEvent as ReactMouseEvent } from "react";
import { rectCenterToViewBox } from "./floorLayoutCoords";

type Options = {
  svgRef: RefObject<SVGSVGElement | null>;
  viewBoxWidth: number;
  viewBoxHeight: number;
  onMove: (id: string, x: number, y: number) => void;
  onSelect: (id: string) => void;
};

/**
 * Mouse-based drag for placed SVG items (not pointer events) so it does not
 * conflict with @dnd-kit PointerSensor used by the palette.
 */
export function useItemPointerDrag({
  svgRef,
  viewBoxWidth,
  viewBoxHeight,
  onMove,
  onSelect,
}: Options) {
  const activeDragId = useRef<string | null>(null);

  const onItemMouseDown = useCallback(
    (id: string, e: ReactMouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      onSelect(id);
      activeDragId.current = id;

      const onMouseMove = (ev: MouseEvent) => {
        if (activeDragId.current !== id) return;
        const svg = svgRef.current;
        if (!svg) return;
        const rect = { left: ev.clientX - 1, top: ev.clientY - 1, width: 2, height: 2 };
        const { x, y } = rectCenterToViewBox(svg, viewBoxWidth, viewBoxHeight, rect);
        onMove(id, x, y);
      };

      const endDrag = () => {
        if (activeDragId.current !== id) return;
        activeDragId.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", endDrag);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", endDrag);
    },
    [svgRef, viewBoxWidth, viewBoxHeight, onMove, onSelect],
  );

  return { onItemMouseDown };
}
