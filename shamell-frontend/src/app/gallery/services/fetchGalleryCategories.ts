import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";
import { mapGalleryCategoriesFromApi } from "../lib/mapGalleryApi";
import type { GalleryTabItem } from "../types/gallery.types";

export async function fetchGalleryCategories(): Promise<GalleryTabItem[]> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/categories`, { cache: "no-store" });
  if (!response.ok) throw new Error("Cannot load gallery categories.");
  const data: unknown = await response.json();
  return mapGalleryCategoriesFromApi(data);
}
