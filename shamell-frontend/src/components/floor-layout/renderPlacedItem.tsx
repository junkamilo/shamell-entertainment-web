import type { MouseEvent } from "react";
import { CHAIR_SILHOUETTE_PATH } from "@/components/venue-3d/chair/chairSilhouettePath";
import type { PlacedLayoutItem } from "./layoutTypes";
import { TABLE_SIZE_LABELS } from "./layoutTypes";
import {
  SELECTION_STROKE,
  STANDALONE_CHAIR_VISUAL,
  tableVisualForSize,
} from "./shapeConfig";

type Props = {
  item: PlacedLayoutItem;
  selected?: boolean;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onMouseDown?: (id: string, e: MouseEvent) => void;
};

export function renderPlacedItem({
  item,
  selected = false,
  interactive = false,
  onSelect,
  onMouseDown,
}: Props) {
  const handleClick = interactive
    ? (e: MouseEvent) => {
        e.stopPropagation();
        onSelect?.(item.id);
      }
    : undefined;

  const handleMouseDown = interactive
    ? (e: MouseEvent) => {
        onMouseDown?.(item.id, e);
      }
    : undefined;

  if (item.kind === "standalone_chair") {
    const cfg = STANDALONE_CHAIR_VISUAL;
    const stroke = selected ? SELECTION_STROKE : cfg.stroke;
    return (
      <g
        key={item.id}
        transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}
        style={interactive ? { cursor: "grab" } : undefined}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
      >
        <path
          d={CHAIR_SILHOUETTE_PATH}
          fill={cfg.fill}
          stroke={stroke}
          strokeWidth={selected ? 3 : 2}
        />
      </g>
    );
  }

  const cfg = tableVisualForSize(item.size);
  const stroke = selected ? SELECTION_STROKE : cfg.stroke;
  const strokeWidth = selected ? 3 : 2;

  return (
    <g
      key={item.id}
      transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}
      style={interactive ? { cursor: "grab" } : undefined}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      <circle r={cfg.size} fill={cfg.fill} stroke={stroke} strokeWidth={strokeWidth} />
      <text
        y={cfg.size + 14}
        textAnchor="middle"
        fontSize="11"
        fill="#4A1F3A"
        fontWeight="600"
      >
        {item.includedChairs}
      </text>
      <text
        y={cfg.size + 28}
        textAnchor="middle"
        fontSize="9"
        fill="#4A1F3A"
        opacity={0.85}
      >
        {TABLE_SIZE_LABELS[item.size]}
      </text>
    </g>
  );
}
