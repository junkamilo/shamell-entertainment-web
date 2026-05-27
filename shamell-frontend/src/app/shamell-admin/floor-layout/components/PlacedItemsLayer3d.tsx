"use client";

import PlacedItemsLayer from "@/components/venue-3d/PlacedItemsLayer";
import { useItemPointerDrag3d } from "../lib/useItemPointerDrag3d";
import type { PlacedLayoutItem } from "../types/floorLayout.types";

type Props = {
  items: PlacedLayoutItem[];
  viewBoxWidth: number;
  viewBoxHeight: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
};

export default function PlacedItemsLayer3d({
  items,
  viewBoxWidth,
  viewBoxHeight,
  selectedId,
  onSelect,
  onMoveItem,
}: Props) {
  const { onItemPointerDown } = useItemPointerDrag3d({
    viewBoxWidth,
    viewBoxHeight,
    onMove: onMoveItem,
    onSelect: (id) => onSelect(id),
  });

  return (
    <PlacedItemsLayer
      items={items}
      viewBoxWidth={viewBoxWidth}
      viewBoxHeight={viewBoxHeight}
      selectedId={selectedId}
      interactive
      onSelect={(id) => onSelect(id)}
      onItemPointerDown={onItemPointerDown}
    />
  );
}
