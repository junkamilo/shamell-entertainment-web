import { mapStandaloneChairFromApi } from "@/app/shamell-admin/venue-tables/lib/mapStandaloneChairFromApi";
import type { StandaloneChairConfig } from "@/app/shamell-admin/venue-tables/types/standaloneChairs.types";
import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export async function fetchPublicStandaloneChairs(): Promise<StandaloneChairConfig> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/standalone-chairs`, { cache: "no-store" });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return mapStandaloneChairFromApi(null);
  }
  return mapStandaloneChairFromApi(data);
}
