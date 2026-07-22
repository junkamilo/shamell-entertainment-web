import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapGalleryPhotosFromApi } from "../lib/mapGalleryPhotoFromApi";
import { parseGalleryError } from "../lib/galleryErrors";
import type { GalleryPhoto } from "../types/gallery.types";

export async function fetchAdminGalleryPhotos(token: string): Promise<GalleryPhoto[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/admin/photos`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(parseGalleryError(data, "Could not load media."));
  }
  return mapGalleryPhotosFromApi(data);
}
