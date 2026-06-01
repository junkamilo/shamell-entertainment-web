import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";

/** Resolves the checkout/display price for a placed standalone chair. */
export function resolveStandaloneChairUnitPrice(
  item: PlacedLayoutItem,
  chairPricesById: ReadonlyMap<string, number>,
  fallbackUnitPrice: number,
): number | null {
  if (item.kind !== "standalone_chair") return null;

  if (typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice)) {
    return item.unitPrice;
  }

  const fromCatalog = chairPricesById.get(item.venueStandaloneChairId);
  if (fromCatalog != null && Number.isFinite(fromCatalog)) {
    return fromCatalog;
  }

  if (fallbackUnitPrice > 0 && Number.isFinite(fallbackUnitPrice)) {
    return fallbackUnitPrice;
  }

  return null;
}

export function buildStandaloneChairPriceMap(
  chairs: ReadonlyArray<{ id: string; unitPrice: number }> | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  if (!chairs) return map;
  for (const chair of chairs) {
    if (typeof chair.id === "string" && Number.isFinite(chair.unitPrice)) {
      map.set(chair.id, chair.unitPrice);
    }
  }
  return map;
}
