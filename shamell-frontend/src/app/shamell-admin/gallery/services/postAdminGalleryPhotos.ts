import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseGalleryError } from "../lib/galleryErrors";
import type { GalleryPhotoBatchResponse } from "../types/gallery.types";

export async function postAdminGalleryPhotos(
  token: string,
  body: FormData,
): Promise<GalleryPhotoBatchResponse> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/admin/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseGalleryError(data, "Could not save media."));
  }
  const payload = data as { items?: unknown };
  return {
    items: Array.isArray(payload.items) ? payload.items : [],
  };
}
