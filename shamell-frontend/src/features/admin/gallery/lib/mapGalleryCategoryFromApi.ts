import type { GalleryCategory } from "../types/gallery.types";

export function mapGalleryCategoryFromApi(row: Record<string, unknown>): GalleryCategory {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    isActive: Boolean(row.isActive),
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

export function mapGalleryCategoriesFromApi(data: unknown): GalleryCategory[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapGalleryCategoryFromApi);
}
