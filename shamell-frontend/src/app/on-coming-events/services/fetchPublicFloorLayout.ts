import { mapFloorLayoutFromApi } from "@/app/shamell-admin/on-coming-events/layout/lib/mapFloorLayoutFromApi";
import type { VenueFloorLayout } from "@/components/floor-layout/layoutTypes";
import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export async function fetchPublicFloorLayout(): Promise<VenueFloorLayout | null> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/floor-layout`, {
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) return null;
  return mapFloorLayoutFromApi(data);
}
