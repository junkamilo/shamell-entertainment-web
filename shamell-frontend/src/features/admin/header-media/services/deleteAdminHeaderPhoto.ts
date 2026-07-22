import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseHeaderMediaError } from "../lib/headerMediaErrors";

export async function deleteAdminHeaderPhoto(token: string, id: string): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/header-media/admin/photos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseHeaderMediaError(data, "Could not delete the item."));
  }
}
