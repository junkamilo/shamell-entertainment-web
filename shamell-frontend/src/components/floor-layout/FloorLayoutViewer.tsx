/** @deprecated Use VenueScene3D (mode="public") instead. Kept for reference only. */
"use client";

import FloorLayoutBackground from "./FloorLayoutBackground";
import type { VenueFloorLayout } from "./layoutTypes";
import { renderPlacedItem } from "./renderPlacedItem";

type Props = {
  layout: VenueFloorLayout;
  className?: string;
};

export default function FloorLayoutViewer({ layout, className }: Props) {
  const { viewBoxWidth, viewBoxHeight, backgroundVersion, items } = layout;

  return (
    <div
      className={className}
      style={{ touchAction: "none" }}
    >
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="h-auto w-full max-w-full"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Venue floor plan"
      >
        <FloorLayoutBackground
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
          backgroundVersion={backgroundVersion}
        />
        <g id="floor-layout-items">
          {items.map((item) =>
            renderPlacedItem({ item, selected: false, interactive: false }),
          )}
        </g>
      </svg>
    </div>
  );
}
