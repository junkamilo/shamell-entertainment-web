import type { GalleryCategoryPhotoPreview } from "../types/gallery.types";

export function mapGalleryPhotoPreviewsFromApi(data: unknown): GalleryCategoryPhotoPreview[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[])
    .filter((p) => p.categoryId && p.imageUrl)
    .map((p) => ({
      categoryId: String(p.categoryId),
      imageUrl: String(p.imageUrl),
    }));
}
