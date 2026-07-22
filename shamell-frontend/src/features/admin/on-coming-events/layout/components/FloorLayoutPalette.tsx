"use client";

import { cn } from "@/lib/utils";
import type { PaletteDragKind } from "../hooks/useFloorLayoutEditor";
import { CHAIR_SILHOUETTE_PATH } from "@/components/venue-3d/chair/chairSilhouettePath";
import { tableVisualForSize } from "../lib/floorLayoutShapes";
import type { FloorLayoutPalette, VenueTableSize } from "../types/floorLayout.types";
import { TABLE_SIZE_LABELS } from "../types/floorLayout.types";

type PaletteTileProps = {
  id: string;
  label: string;
  count: number;
  paletteDrag: PaletteDragKind;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent, drag: PaletteDragKind, label: string) => void;
};

export function PaletteItemIcon({ drag }: { drag: PaletteDragKind }) {
  if (drag.type === "chair") {
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

  const cfg = tableVisualForSize(drag.size);
  return (
    <svg width="48" height="40" viewBox="-30 -24 60 48" aria-hidden>
      <circle r={Math.min(cfg.size, 18)} fill={cfg.fill} stroke={cfg.stroke} strokeWidth={2} />
    </svg>
  );
}

function PaletteTile({
  label,
  count,
  paletteDrag,
  isDragging,
  onPointerDown,
}: PaletteTileProps) {
  return (
    <button
      type="button"
      onPointerDown={(e) => onPointerDown(e, paletteDrag, label)}
      className={cn(
        "flex shrink-0 touch-manipulation flex-col items-center gap-1 rounded-lg border border-shamell-line-soft bg-shamell-twilight/40 px-3 py-2 text-xs text-shamell-text-primary transition hover:border-shamell-gold/50 min-w-[5.5rem] lg:min-w-0 select-none",
        isDragging && "border-shamell-gold/70 opacity-50",
      )}
      aria-label={`Tap to place ${label} at center, or drag onto floor plan`}
    >
      <PaletteItemIcon drag={paletteDrag} />
      <span className="text-center leading-tight font-medium">
        {label} × {count}
      </span>
    </button>
  );
}

type Props = {
  palette: FloorLayoutPalette;
  activePaletteDrag: PaletteDragKind | null;
  onTilePointerDown: (e: React.PointerEvent, drag: PaletteDragKind, label: string) => void;
};

const TABLE_SIZES: VenueTableSize[] = ["LARGE", "MEDIUM", "SMALL"];

function paletteDragKey(drag: PaletteDragKind): string {
  return drag.type === "table" ? `table-${drag.size}` : "chair";
}

function isSamePaletteDrag(a: PaletteDragKind | null, b: PaletteDragKind): boolean {
  if (!a) return false;
  if (a.type !== b.type) return false;
  if (a.type === "chair" && b.type === "chair") return true;
  return a.type === "table" && b.type === "table" && a.size === b.size;
}

export default function FloorLayoutPalette({
  palette,
  activePaletteDrag,
  onTilePointerDown,
}: Props) {
  const visibleTiles: Omit<PaletteTileProps, "onPointerDown" | "isDragging">[] = [];

  for (const size of TABLE_SIZES) {
    const count = palette.tablesBySize[size];
    if (count > 0) {
      visibleTiles.push({
        id: `palette-table-${size}`,
        label: TABLE_SIZE_LABELS[size],
        count,
        paletteDrag: { type: "table", size },
      });
    }
  }

  if (palette.standaloneChairsAvailable > 0) {
    visibleTiles.push({
      id: "palette-chair",
      label: "Chairs",
      count: palette.standaloneChairsAvailable,
      paletteDrag: { type: "chair" },
    });
  }

  return (
    <aside className="shrink-0 border-b border-shamell-line-soft px-3 py-2 sm:px-4 sm:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-shamell-gold">
          Palette
        </p>
        <p className="max-w-xl text-[10px] leading-snug text-shamell-text-primary/60 lg:hidden">
          Tap to place at center · drag onto the floor plan. Counts decrease as you place items.
        </p>
        <p className="hidden max-w-xl text-[10px] leading-snug text-shamell-text-primary/60 lg:block">
          From Table seating inventory. Tap to place at center · drag onto the floor plan. Counts
          decrease as you place items.
        </p>
      </div>
      {visibleTiles.length === 0 ? (
        <p className="text-xs text-shamell-text-primary/70">
          No tables or chairs available. Configure them in Table seating.
        </p>
      ) : (
        <div className="-mx-1 flex touch-pan-x gap-2 overflow-x-auto px-1 pb-1 shamell-scrollbar lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0 lg:pb-0">
          {visibleTiles.map((tile) => (
            <PaletteTile
              key={paletteDragKey(tile.paletteDrag)}
              {...tile}
              isDragging={isSamePaletteDrag(activePaletteDrag, tile.paletteDrag)}
              onPointerDown={onTilePointerDown}
            />
          ))}
        </div>
      )}
    </aside>
  );
}
