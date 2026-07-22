import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapFloorLayoutFromApi } from "../lib/mapFloorLayoutFromApi";
import type { VenueFloorLayout } from "../types/floorLayout.types";

export type FetchAdminFloorLayoutResult = {
  ok: boolean;
  layout: VenueFloorLayout | null;
  data: unknown;
  status: number;
};

export async function fetchAdminFloorLayout(
  token: string,
): Promise<FetchAdminFloorLayoutResult> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/floor-layout/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, layout: null, data, status: response.status };
  }
  return {
    ok: true,
    layout: mapFloorLayoutFromApi(data),
    data,
    status: response.status,
  };
}
