"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { DragSource, PaletteDragKind } from "../hooks/useFloorLayoutEditor";
import { CHAIR_SILHOUETTE_PATH } from "@/components/venue-3d/chair/chairSilhouettePath";
import { tableVisualForSize } from "../lib/floorLayoutShapes";
import type { FloorLayoutPalette, VenueTableSize } from "../types/floorLayout.types";
import { TABLE_SIZE_LABELS } from "../types/floorLayout.types";

type PaletteTileProps = {
  id: string;
  label: string;
  count: number;
  paletteDrag: PaletteDragKind;
  renderIcon: () => React.ReactNode;
};

function PaletteTile({ id, label, count, paletteDrag, renderIcon }: PaletteTileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { source: "palette" as DragSource, paletteDrag },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border border-shamell-line-soft bg-shamell-twilight/40 px-3 py-2 text-xs text-shamell-text-primary transition hover:border-shamell-gold/50",
      )}
      aria-label={`Drag ${label} onto floor plan`}
    >
      {renderIcon()}
      <span className="text-center leading-tight font-medium">
        {label} × {count}
      </span>
    </button>
  );
}

function TableIcon({ size }: { size: VenueTableSize }) {
  const cfg = tableVisualForSize(size);
  return (
    <svg width="48" height="40" viewBox="-30 -24 60 48" aria-hidden>
      <circle r={Math.min(cfg.size, 18)} fill={cfg.fill} stroke={cfg.stroke} strokeWidth={2} />
    </svg>
  );
}

function ChairIcon() {
  return (
    <svg width="48" height="40" viewBox="-12 -18 24 36" aria-hidden>
      <path
        d={CHAIR_SILHOUETTE_PATH}
        fill="#8b1530"
        stroke="#5a1020"
        strokeWidth={1.2}
      />
    </svg>
  );
}

type Props = {
  palette: FloorLayoutPalette;
};

const TABLE_SIZES: VenueTableSize[] = ["LARGE", "MEDIUM", "SMALL"];

export default function FloorLayoutPalette({ palette }: Props) {
  const visibleTiles: PaletteTileProps[] = [];

  for (const size of TABLE_SIZES) {
    const count = palette.tablesBySize[size];
    if (count > 0) {
      visibleTiles.push({
        id: `palette-table-${size}`,
        label: TABLE_SIZE_LABELS[size],
        count,
        paletteDrag: { type: "table", size },
        renderIcon: () => <TableIcon size={size} />,
      });
    }
  }

  if (palette.standaloneChairsAvailable > 0) {
    visibleTiles.push({
      id: "palette-chair",
      label: "Chairs",
      count: palette.standaloneChairsAvailable,
      paletteDrag: { type: "chair" },
      renderIcon: () => <ChairIcon />,
    });
  }

  return (
    <aside className="shrink-0 border-b border-shamell-line-soft px-3 py-2 sm:px-4 sm:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-shamell-gold">
          Palette
        </p>
        <p className="hidden max-w-xl text-[10px] leading-snug text-shamell-text-primary/60 sm:block">
          From Table seating inventory. Drag from here to place on the floor plan. Counts
          decrease as you place items.
        </p>
      </div>
      {visibleTiles.length === 0 ? (
        <p className="text-xs text-shamell-text-primary/70">
          No tables or chairs available. Configure them in Table seating.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {visibleTiles.map((tile) => (
            <PaletteTile key={tile.id} {...tile} />
          ))}
        </div>
      )}
    </aside>
  );
}
