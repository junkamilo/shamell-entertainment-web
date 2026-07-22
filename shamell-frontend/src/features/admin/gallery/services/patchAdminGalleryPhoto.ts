import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseGalleryError } from "../lib/galleryErrors";

export async function patchAdminGalleryPhoto(
  token: string,
  id: string,
  body: FormData,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/admin/photos/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseGalleryError(data, "Could not save media."));
  }
}
