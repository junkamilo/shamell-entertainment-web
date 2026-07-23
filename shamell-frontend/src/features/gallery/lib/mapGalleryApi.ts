import { GALLERY_CATCHALL_SLUG } from "@/lib/galleryConstants";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import type {
  GalleryCategoryApiItem,
  GalleryPhotoApiItem,
  GalleryPhotoItem,
  GalleryTabItem,
} from "../types/gallery.types";

export function galleryMediaTypeFromItem(
  imageUrl: string,
  rawMediaType: unknown,
): "IMAGE" | "VIDEO" {
  const fromApi = String(rawMediaType ?? "")
    .trim()
    .toUpperCase();
  // Trust the API mediaType; fall back to URL inference only when absent.
  if (fromApi === "VIDEO") return "VIDEO";
  if (fromApi === "IMAGE") return "IMAGE";
  if (serviceCatalogMediaTypeFromUrl(imageUrl) === "VIDEO") return "VIDEO";
  return "IMAGE";
}

export function mapGalleryCategoriesFromApi(data: unknown): GalleryTabItem[] {
  if (!Array.isArray(data)) return [];

  const mapped = (data as GalleryCategoryApiItem[])
    .filter((item) => item?.slug && item?.name)
    .filter((item) => item.slug !== GALLERY_CATCHALL_SLUG)
    .map((item) => ({
      id: item.slug,
      label: item.name,
    }));

  return [{ id: "all", label: "All" }, ...mapped];
}

export function mapGalleryPhotosFromApi(data: unknown): GalleryPhotoItem[] {
  if (typeof data !== "object" || data === null) return [];
  const payload = data as { items?: GalleryPhotoApiItem[] };
  if (!Array.isArray(payload.items)) return [];

  return payload.items.map((item) => ({
    id: item.id,
    src: item.imageUrl,
    posterUrl:
      typeof item.posterUrl === "string" && item.posterUrl.trim()
        ? item.posterUrl.trim()
        : null,
    alt: `${item.category.name} — gallery`,
    categorySlug: item.category.slug,
    mediaType: galleryMediaTypeFromItem(item.imageUrl, item.mediaType),
  }));
}
