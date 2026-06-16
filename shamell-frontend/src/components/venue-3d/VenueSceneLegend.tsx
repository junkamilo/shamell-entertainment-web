"use client";

import { cn } from "@/lib/utils";
import type { FloorLayoutPalette } from "@/components/floor-layout/layoutTypes";
import { TABLE_SIZE_LABELS } from "@/components/floor-layout/layoutTypes";

type Props = {
  palette?: FloorLayoutPalette | null;
  placedSummary?: {
    large: number;
    medium: number;
    small: number;
    chairs: number;
  };
  showReservationKey?: boolean;
  showEditorHints?: boolean;
  /** Place legend along the top on phones/tablets so it does not cover the floor. */
  layoutTopOnNarrow?: boolean;
  /** Brief hint for mobile tap-to-reveal labels. */
  showMobileLabelHint?: boolean;
};

export default function VenueSceneLegend({
  palette,
  placedSummary,
  showReservationKey = false,
  showEditorHints = false,
  layoutTopOnNarrow = false,
  showMobileLabelHint = false,
}: Props) {
  const large = palette?.tablesBySize.LARGE ?? placedSummary?.large ?? 0;
  const medium = palette?.tablesBySize.MEDIUM ?? placedSummary?.medium ?? 0;
  const small = palette?.tablesBySize.SMALL ?? placedSummary?.small ?? 0;
  const chairs =
    palette?.standaloneChairsAvailable ?? placedSummary?.chairs ?? 0;

  const hasTableKey = large > 0 || medium > 0 || small > 0 || chairs > 0;

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-10 rounded-lg border border-shamell-gold/30 bg-black/75 text-shamell-gold shadow-lg backdrop-blur-sm",
        layoutTopOnNarrow
          ? "top-2 right-2 left-2 max-w-none px-3 py-2 text-xs leading-snug"
          : "bottom-4 left-4 max-w-[220px] px-4 py-3 text-[11px] leading-relaxed",
      )}
    >
      <p
        className={cn(
          "font-brand tracking-[0.2em] text-shamell-gold/90",
          layoutTopOnNarrow ? "mb-1.5 text-[9px]" : "mb-2 text-[10px]",
        )}
      >
        VENUE KEY
      </p>
      <div
        className={cn(
          layoutTopOnNarrow && hasTableKey
            ? "flex flex-wrap items-center gap-x-3 gap-y-1"
            : undefined,
        )}
      >
        {large > 0 ? (
          <p className="text-shamell-text-primary/90">
            <span className="font-semibold text-shamell-gold">{TABLE_SIZE_LABELS.LARGE}</span>
            {palette ? ` — ${large} available` : ` — ${large} placed`}
          </p>
        ) : null}
        {medium > 0 ? (
          <p className="text-shamell-text-primary/90">
            <span className="font-semibold text-shamell-gold">{TABLE_SIZE_LABELS.MEDIUM}</span>
            {palette ? ` — ${medium} available` : ` — ${medium} placed`}
          </p>
        ) : null}
        {small > 0 ? (
          <p className="text-shamell-text-primary/90">
            <span className="font-semibold text-shamell-gold">{TABLE_SIZE_LABELS.SMALL}</span>
            {palette ? ` — ${small} available` : ` — ${small} placed`}
          </p>
        ) : null}
        {chairs > 0 ? (
          <p className={cn("text-shamell-text-primary/90", !layoutTopOnNarrow && "mt-1")}>
            <span className="font-semibold text-shamell-gold">Standalone chairs</span>
            {palette ? ` — ${chairs} available` : ` — ${chairs} placed`}
          </p>
        ) : null}
      </div>
      {showEditorHints ? (
        <div className="mt-3 border-t border-shamell-gold/20 pt-2 text-shamell-text-primary/80">
          <p>Drag a table or chair to move it.</p>
          <p className="mt-1">One finger to orbit · two fingers to pan and pinch to zoom.</p>
        </div>
      ) : null}
      {showReservationKey ? (
        <div
          className={cn(
            "border-shamell-gold/20 pt-2",
            layoutTopOnNarrow
              ? "mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 border-t"
              : "mt-3 border-t",
          )}
        >
          <p className="text-shamell-text-primary/90">
            <span className="inline-block h-2 w-2 rounded-full bg-shamell-gold/80" /> Available
          </p>
          <p className="text-shamell-text-primary/90">
            <span className="inline-block h-2 w-2 rounded-full bg-[#8a8a8a]" /> Sold (paid)
          </p>
          <p className="text-shamell-text-primary/90">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-300" /> Selected
          </p>
          <p
            className={cn(
              "text-shamell-text-primary/75",
              layoutTopOnNarrow ? "basis-full" : "mt-1",
            )}
          >
            Numbers match your confirmation (e.g. Large 4)
          </p>
          {showMobileLabelHint ? (
            <p className="basis-full text-shamell-text-primary/70">
              Tap a table or chair to see its number
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
