import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export async function deleteAdminAboutHero(
  token: string,
): Promise<{ response: Response; data: unknown }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/about/admin/media`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  return { response, data };
}
