import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapServiceTypesFromApi } from "../lib/mapServiceTypeFromApi";
import { parseServiceTypesError } from "../lib/serviceTypesErrors";
import type { ServiceTypeItem } from "../types/serviceTypes.types";

export async function fetchAdminServiceTypes(token: string): Promise<ServiceTypeItem[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/services/types/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(parseServiceTypesError(data, "Could not load service types."));
  }
  return mapServiceTypesFromApi(data);
}
