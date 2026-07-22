import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";

export async function postAdminEventCatalogImages(
  token: string,
  eventId: string,
  files: File[],
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const fd = new FormData();
  files.forEach((f) => fd.append("media", f));
  const response = await fetch(`${base}/api/v1/events/admin/${eventId}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      nestApiErrorMessage(data, "The event was saved but catalog media upload failed."),
    );
  }
}
