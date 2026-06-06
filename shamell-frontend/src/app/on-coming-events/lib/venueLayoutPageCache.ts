import type { VenueTableConfig } from "@/app/shamell-admin/venue-tables/types/venueTables.types";
import type { StandaloneChairConfig } from "@/app/shamell-admin/venue-tables/types/standaloneChairs.types";
import type { VenueFloorLayout } from "@/components/floor-layout/layoutTypes";
import type { SalesClosedReason } from "../services/fetchVenueReservationAvailability";

export type VenueLayoutPageCacheEntry = {
  layout: VenueFloorLayout;
  tables: VenueTableConfig[];
  standaloneChairs: StandaloneChairConfig;
  clientEnabled: boolean;
  eventLabel: string | null;
  eventTitle: string;
  eventDescription: string;
  eventItems: string[];
  heroImageUrl: string | null;
  heroMediaType: "IMAGE" | "VIDEO" | null;
  eventPrice: number | null;
  eventStartsAt?: string;
  tableCapacity?: number;
  tablesRemaining?: number;
  tablesSold?: number;
  eventDateIso: string | null;
  reservationsOpen: boolean;
  salesClosedReason: SalesClosedReason | null;
  reservedLayoutItemIds: string[];
  paidSeatHolders: { layoutItemId: string; customerName: string }[];
};

const cache = new Map<string, VenueLayoutPageCacheEntry>();
const LEGACY_KEY = "__legacy__";

export function getVenueLayoutPageCache(eventSlug?: string): VenueLayoutPageCacheEntry | null {
  return cache.get(eventSlug ?? LEGACY_KEY) ?? null;
}

export function setVenueLayoutPageCache(
  eventSlug: string | undefined,
  entry: VenueLayoutPageCacheEntry,
): void {
  cache.set(eventSlug ?? LEGACY_KEY, entry);
}

export function patchVenueLayoutPageAvailability(
  eventSlug: string | undefined,
  patch: Pick<
    VenueLayoutPageCacheEntry,
    | "reservedLayoutItemIds"
    | "paidSeatHolders"
    | "reservationsOpen"
    | "salesClosedReason"
    | "eventDateIso"
    | "tablesRemaining"
    | "tablesSold"
    | "tableCapacity"
    | "eventStartsAt"
  >,
): void {
  const key = eventSlug ?? LEGACY_KEY;
  const existing = cache.get(key);
  if (!existing) return;
  cache.set(key, { ...existing, ...patch });
}
