import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseGalleryError } from "@/features/admin/gallery/lib/galleryErrors";

export async function patchAdminGalleryCategory(
  token: string,
  categoryId: string,
  name: string,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/gallery/admin/categories/${categoryId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseGalleryError(data, "Could not save the category."));
  }
}
