import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapVenueTableFromApi } from "../lib/mapVenueTableFromApi";
import type {
  VenueTableConfig,
  VenueTableConfigPayload,
} from "../types/venueTables.types";

export async function postAdminVenueTable(
  token: string,
  payload: VenueTableConfigPayload,
): Promise<{ ok: boolean; item: VenueTableConfig | null; data: unknown; status: number }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  return {
    ok: response.ok,
    item: response.ok ? mapVenueTableFromApi(data) : null,
    data,
    status: response.status,
  };
}
