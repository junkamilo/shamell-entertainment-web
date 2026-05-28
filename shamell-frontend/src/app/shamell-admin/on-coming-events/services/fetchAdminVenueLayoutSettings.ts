import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { normalizeVenueLayoutSettings } from "../types/venueLayoutPromo.types";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export async function fetchAdminVenueLayoutSettings(
  token: string,
): Promise<{ ok: boolean; settings: VenueLayoutClientSettings | null; status: number }> {
  const base = getAdminApiBaseUrl();
  try {
    const response = await fetch(`${base}/api/v1/on-coming-events/settings/admin`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      return { ok: false, settings: null, status: response.status };
    }
    return {
      ok: true,
      settings: normalizeVenueLayoutSettings(data),
      status: response.status,
    };
  } catch {
    // Network failures should not bubble as unhandled rejections in UI effects.
    return { ok: false, settings: null, status: 0 };
  }
}
