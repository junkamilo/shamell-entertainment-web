import { mapVenueTablesListFromApi } from "@/features/admin/venue-tables/lib/mapVenueTableFromApi";
import type { VenueTableConfig } from "@/features/admin/venue-tables/types/venueTables.types";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

export async function fetchPublicVenueTables(): Promise<VenueTableConfig[]> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables`, { cache: "no-store" });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) return [];
  return mapVenueTablesListFromApi(data);
}
