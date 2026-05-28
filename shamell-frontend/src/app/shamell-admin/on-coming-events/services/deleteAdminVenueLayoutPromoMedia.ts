import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { normalizeVenueLayoutSettings } from "../types/venueLayoutPromo.types";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export async function deleteAdminVenueLayoutPromoMedia(
  token: string,
): Promise<{ ok: boolean; settings: VenueLayoutClientSettings | null; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/on-coming-events/settings/admin/media`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not remove image.";
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
