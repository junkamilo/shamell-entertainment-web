/** @deprecated Replaced by FloorLayoutScene3D (React Three Fiber). Kept for reference only. */
"use client";

import { useDroppable } from "@dnd-kit/core";
import FloorLayoutBackground from "@/components/floor-layout/FloorLayoutBackground";
import { useItemPointerDrag } from "../lib/useItemPointerDrag";
import { FLOOR_CANVAS_DROPPABLE_ID } from "../hooks/useFloorLayoutEditor";
import type { PlacedLayoutItem } from "../types/floorLayout.types";
import FloorLayoutPlacedItem from "./FloorLayoutPlacedItem";

type Props = {
  svgRef: React.RefObject<SVGSVGElement | null>;
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: PlacedLayoutItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
};

export default function FloorLayoutCanvas({
  svgRef,
  viewBoxWidth,
  viewBoxHeight,
  backgroundVersion,
  items,
  selectedId,
  onSelect,
  onMoveItem,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: FLOOR_CANVAS_DROPPABLE_ID });

  const { onItemMouseDown } = useItemPointerDrag({
    svgRef,
    viewBoxWidth,
    viewBoxHeight,
    onMove: onMoveItem,
    onSelect: (id) => onSelect(id),
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-0 min-w-0 flex-1 overflow-auto rounded-lg border bg-white/95 p-0.5 transition ${
        isOver ? "border-shamell-gold ring-2 ring-shamell-gold/30" : "border-shamell-line-soft"
      }`}
      style={{ touchAction: "none" }}
      onClick={() => onSelect(null)}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="mx-auto block h-full min-h-[min(72vh,640px)] w-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Editable venue floor plan"
      >
        <FloorLayoutBackground
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
          backgroundVersion={backgroundVersion}
        />
        <g id="floor-layout-items">
          {items.map((item) => (
            <FloorLayoutPlacedItem
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={(id) => onSelect(id)}
              onMouseDown={onItemMouseDown}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
