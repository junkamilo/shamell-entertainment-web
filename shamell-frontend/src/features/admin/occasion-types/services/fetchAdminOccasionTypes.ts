import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapOccasionTypesFromApi } from "../lib/mapOccasionTypeFromApi";
import { parseOccasionTypesError } from "../lib/occasionTypesErrors";
import type { OccasionTypeItem } from "../types/occasionTypes.types";

export async function fetchAdminOccasionTypes(token: string): Promise<OccasionTypeItem[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/occasions/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(parseOccasionTypesError(data, "Could not load occasion types."));
  }
  return mapOccasionTypesFromApi(data);
}
