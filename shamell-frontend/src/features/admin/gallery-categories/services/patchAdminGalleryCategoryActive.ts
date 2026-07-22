import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseGalleryError } from "@/features/admin/gallery/lib/galleryErrors";

export async function patchAdminGalleryCategoryActive(
  token: string,
  categoryId: string,
  isActive: boolean,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/admin/categories/${categoryId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseGalleryError(data, "Could not change the category status."));
  }
}
