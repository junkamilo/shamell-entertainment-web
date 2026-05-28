import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { normalizeVenueLayoutSettings } from "../types/venueLayoutPromo.types";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export async function upsertAdminVenueLayoutPromoMedia(
  token: string,
  file: File,
): Promise<{ ok: boolean; settings: VenueLayoutClientSettings | null; message?: string }> {
  const base = getAdminApiBaseUrl();
  const form = new FormData();
  form.append("media", file);
  const response = await fetch(`${base}/api/v1/on-coming-events/settings/admin/media`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Image upload failed.";
    return { ok: false, settings: null, message: msg };
  }
  return {
    ok: true,
    settings: normalizeVenueLayoutSettings(data),
    message:
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : undefined,
  };
}
