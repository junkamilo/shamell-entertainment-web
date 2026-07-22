import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseHeaderMediaError } from "../lib/headerMediaErrors";

export async function patchAdminHeaderPhotoActive(
  token: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/header-media/admin/photos/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseHeaderMediaError(data, "Could not update the item status."));
  }
}
