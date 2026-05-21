import type { GalleryPhoto } from "../types/gallery.types";

export function mapGalleryPhotoFromApi(row: Record<string, unknown>): GalleryPhoto {
  const category = row.category;
  const cat =
    typeof category === "object" && category !== null
      ? (category as Record<string, unknown>)
      : {};
  return {
    id: String(row.id),
    imageUrl: String(row.imageUrl ?? ""),
    isActive: Boolean(row.isActive),
    mediaType: typeof row.mediaType === "string" ? row.mediaType : undefined,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    category: {
      id: String(cat.id ?? ""),
      name: String(cat.name ?? ""),
      slug: String(cat.slug ?? ""),
    },
  };
}

export function mapGalleryPhotosFromApi(data: unknown): GalleryPhoto[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapGalleryPhotoFromApi);
}
