"use client";

import { renderPlacedItem } from "@/components/floor-layout/renderPlacedItem";
import type { PlacedLayoutItem } from "../types/floorLayout.types";

type Props = {
  item: PlacedLayoutItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onMouseDown: (id: string, e: React.MouseEvent) => void;
};

export default function FloorLayoutPlacedItem({
  item,
  selected,
  onSelect,
  onMouseDown,
}: Props) {
  return renderPlacedItem({
    item,
    selected,
    interactive: true,
    onSelect,
    onMouseDown,
  });
}
