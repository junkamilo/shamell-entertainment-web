import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapVenueTablesListFromApi } from "../lib/mapVenueTableFromApi";
import type { VenueTableConfig } from "../types/venueTables.types";

export async function fetchAdminVenueTables(token: string): Promise<{
  ok: boolean;
  items: VenueTableConfig[];
  status: number;
}> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  return {
    ok: response.ok,
    items: response.ok ? mapVenueTablesListFromApi(data) : [],
    status: response.status,
  };
}
