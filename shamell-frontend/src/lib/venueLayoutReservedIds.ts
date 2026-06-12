import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import type { LayoutItemLabel } from "@/lib/venueSeatDisplayLabel";

function normalizeSeatLabel(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Maps paid seats to current layout item ids. Falls back to venueTableConfigId when
 * layout JSON was re-saved and layoutItemId on the reservation no longer matches.
 * Also matches by short display label (e.g. "Large 4") from the reservation catalog.
 */
export function buildReservedLayoutItemIdSet(
  items: readonly PlacedLayoutItem[],
  reservedLayoutItemIds: readonly string[],
  reservedVenueTableConfigIds: readonly string[] = [],
  itemLabels?: ReadonlyMap<string, LayoutItemLabel>,
  reservedSeatShortLabels: readonly string[] = [],
): Set<string> {
  const reserved = new Set(reservedLayoutItemIds.filter(Boolean));

  const configIds = new Set(reservedVenueTableConfigIds.filter(Boolean));
  for (const item of items) {
    if (item.kind !== "catalog_table") continue;
    if (configIds.has(item.venueTableConfigId)) {
      reserved.add(item.id);
    }
  }

  if (reservedSeatShortLabels.length > 0 && itemLabels) {
    const shortLabels = new Set(
      reservedSeatShortLabels.map((label) => normalizeSeatLabel(label)),
    );
    for (const item of items) {
      const label = itemLabels.get(item.id);
      if (!label) continue;
      if (shortLabels.has(normalizeSeatLabel(label.short))) {
        reserved.add(item.id);
      }
    }
  }

  return reserved;
}
