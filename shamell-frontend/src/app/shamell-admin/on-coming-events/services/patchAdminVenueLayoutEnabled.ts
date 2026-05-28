import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { normalizeVenueLayoutSettings } from "../types/venueLayoutPromo.types";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

export async function patchAdminVenueLayoutEnabled(
  token: string,
  clientEnabled: boolean,
): Promise<{ ok: boolean; settings: VenueLayoutClientSettings | null; message?: string }> {
  const base = getAdminApiBaseUrl();
  try {
    const response = await fetch(`${base}/api/v1/on-coming-events/settings/admin/enabled`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientEnabled }),
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const msg =
        data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : "Could not update publish state.";
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
  } catch {
    return { ok: false, settings: null, message: "Could not reach server." };
  }
}
