import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapServicesFromApi } from "../lib/mapServiceFromApi";
import { parseServicesError } from "../lib/servicesErrors";
import type { AdminService } from "../types/services.types";

export async function fetchAdminServices(token: string): Promise<AdminService[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/services/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(parseServicesError(data, "Could not load services."));
  }
  return mapServicesFromApi(data);
}
