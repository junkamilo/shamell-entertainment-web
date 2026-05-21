import { fetchAdminGalleryCategories } from "@/app/shamell-admin/gallery/services/fetchAdminGalleryCategories";
import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapGalleryPhotoPreviewsFromApi } from "@/app/shamell-admin/gallery/lib/mapGalleryPhotoPreviewsFromApi";
import { parseGalleryError } from "@/app/shamell-admin/gallery/lib/galleryErrors";
import type { GalleryCategory, GalleryCategoryPhotoPreview } from "../types/galleryCategories.types";

export type GalleryCategoriesCatalog = {
  categories: GalleryCategory[];
  photos: GalleryCategoryPhotoPreview[];
};

export async function fetchGalleryCategoriesCatalog(token: string): Promise<GalleryCategoriesCatalog> {
  const base = getAdminApiBaseUrl();
  const [categories, photoRes] = await Promise.all([
    fetchAdminGalleryCategories(token),
    fetch(`${base}/api/v1/gallery/admin/photos`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  const photoData: unknown = await photoRes.json().catch(() => []);
  const photos =
    photoRes.ok && Array.isArray(photoData) ? mapGalleryPhotoPreviewsFromApi(photoData) : [];

  return {
    categories,
    photos,
  };
}
