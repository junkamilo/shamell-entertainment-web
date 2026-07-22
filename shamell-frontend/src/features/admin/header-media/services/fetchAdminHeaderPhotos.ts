import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapHeaderPhotosFromApi } from "../lib/mapHeaderPhotoFromApi";
import { parseHeaderMediaError } from "../lib/headerMediaErrors";
import type { HeaderPhoto } from "../types/headerMedia.types";

export async function fetchAdminHeaderPhotos(token: string): Promise<HeaderPhoto[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/header-media/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(parseHeaderMediaError(data, "Could not load header photos."));
  }
  return mapHeaderPhotosFromApi(data);
}
