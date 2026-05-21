import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapGalleryCategoriesFromApi } from "../lib/mapGalleryCategoryFromApi";
import { parseGalleryError } from "../lib/galleryErrors";
import type { GalleryCategory } from "../types/gallery.types";

export async function fetchAdminGalleryCategories(token: string): Promise<GalleryCategory[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(parseGalleryError(data, "Could not load categories."));
  }
  return mapGalleryCategoriesFromApi(data);
}
