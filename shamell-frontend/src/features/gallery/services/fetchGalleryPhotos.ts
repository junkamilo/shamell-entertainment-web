import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";
import { mapGalleryPhotosFromApi } from "../lib/mapGalleryApi";
import type { GalleryPhotoItem } from "../types/gallery.types";

export type FetchGalleryPhotosOptions = {
  filter: string;
  limit?: number;
  page?: number;
};

export async function fetchGalleryPhotos({
  filter,
  limit,
  page = 1,
}: FetchGalleryPhotosOptions): Promise<GalleryPhotoItem[]> {
  const base = getPublicApiBaseUrl();
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("category", filter);
  if (limit !== undefined) params.set("limit", String(limit));
  params.set("page", String(page));

  const response = await fetch(`${base}/api/v1/gallery/photos?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Cannot load gallery photos.");
  const data: unknown = await response.json();
  return mapGalleryPhotosFromApi(data);
}
