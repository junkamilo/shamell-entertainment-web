import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";

export function placedSummaryFromItems(items: PlacedLayoutItem[]) {
  const summary = { large: 0, medium: 0, small: 0, chairs: 0 };
  for (const item of items) {
    if (item.kind === "catalog_table") {
      if (item.size === "LARGE") summary.large += 1;
      else if (item.size === "MEDIUM") summary.medium += 1;
      else summary.small += 1;
    } else {
      summary.chairs += 1;
    }
  }
  return summary;
}
