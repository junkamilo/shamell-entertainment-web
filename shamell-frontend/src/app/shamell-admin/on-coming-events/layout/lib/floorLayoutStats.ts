import type { PlacedLayoutItem } from "../types/floorLayout.types";

export function chairCountForItem(item: PlacedLayoutItem): number {
  if (item.kind === "catalog_table") return item.includedChairs;
  return 1;
}

export function totalChairs(items: PlacedLayoutItem[]): number {
  return items.reduce((sum, item) => sum + chairCountForItem(item), 0);
}
