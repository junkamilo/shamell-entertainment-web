import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseHeaderMediaError } from "../lib/headerMediaErrors";

export async function postAdminHeaderPhotos(token: string, files: File[]): Promise<void> {
  const base = getAdminApiBaseUrl();
  const body = new FormData();
  files.forEach((file) => body.append("images", file));
  const response = await fetch(`${base}/api/v1/header-media/admin/photos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseHeaderMediaError(data, "Could not upload header photos."));
  }
}
