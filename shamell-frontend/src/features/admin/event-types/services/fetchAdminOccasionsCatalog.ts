import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { OccasionCatalogItem } from "../types/eventTypes.types";

export async function fetchAdminOccasionsCatalog(token: string): Promise<OccasionCatalogItem[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/occasions/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    isActive: Boolean(row.isActive),
  }));
}
