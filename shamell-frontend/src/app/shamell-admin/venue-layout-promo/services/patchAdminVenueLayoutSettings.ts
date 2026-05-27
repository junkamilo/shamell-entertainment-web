import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { normalizeVenueLayoutSettings } from "../types/venueLayoutPromo.types";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export async function patchAdminVenueLayoutSettings(
  token: string,
  body: {
    clientEnabled?: boolean;
    promoTitle?: string;
    promoDescription?: string;
    reservationEventDate?: string;
    reservationOpensAt?: string;
    reservationClosesAt?: string;
    reservationEventLabel?: string;
    reservationTimezone?: string;
  },
): Promise<{ ok: boolean; settings: VenueLayoutClientSettings | null; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-layout/settings/admin`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not save settings.";
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
