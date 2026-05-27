import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export async function deleteAdminVenueTable(
  token: string,
  id: string,
): Promise<{ ok: boolean; status: number }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return { ok: response.ok, status: response.status };
}
