import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseHeaderMediaError } from "../lib/headerMediaErrors";
import type { FocalUpdateBody } from "../types/headerMedia.types";

export async function patchAdminHeaderPhotoFocal(
  token: string,
  id: string,
  body: FocalUpdateBody,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/header-media/admin/photos/${id}/focal`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseHeaderMediaError(data, "Could not save the focal point."));
  }
}
