import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapVenueTableFromApi } from "../lib/mapVenueTableFromApi";
import type { VenueTableConfig } from "../types/venueTables.types";

export async function fetchAdminVenueTable(
  token: string,
  id: string,
): Promise<{ ok: boolean; item: VenueTableConfig | null; status: number }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  return {
    ok: response.ok,
    item: response.ok ? mapVenueTableFromApi(data) : null,
    status: response.status,
  };
}
