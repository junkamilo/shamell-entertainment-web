import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { AdminVenueAvailability } from "@/app/shamell-admin/on-coming-events/layout/services/fetchAdminVenueAvailability";

export async function fetchBoxOfficeSeatAvailability(
  token: string,
  params: { upcomingEventId?: string; upcomingEventSlug?: string },
): Promise<{ ok: true; data: AdminVenueAvailability } | { ok: false; message: string }> {
  const base = getAdminApiBaseUrl();
  const search = new URLSearchParams();
  if (params.upcomingEventId) search.set("upcomingEventId", params.upcomingEventId);
  if (params.upcomingEventSlug) search.set("upcomingEventSlug", params.upcomingEventSlug);
  const qs = search.toString();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/venue-reservations/admin/availability${qs ? `?${qs}` : ""}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") {
    return { ok: false, message: "Could not load seat availability." };
  }
  const o = data as Record<string, unknown>;
  return {
    ok: true,
    data: {
      upcomingEventId: String(o.upcomingEventId ?? ""),
      upcomingEventSlug:
        typeof o.upcomingEventSlug === "string" ? o.upcomingEventSlug : null,
      eventDate: String(o.eventDate ?? ""),
      reservedLayoutItemIds: Array.isArray(o.reservedLayoutItemIds)
        ? o.reservedLayoutItemIds.map(String)
        : [],
      reservedVenueTableConfigIds: Array.isArray(o.reservedVenueTableConfigIds)
        ? o.reservedVenueTableConfigIds.map(String)
        : [],
      reservedSeatShortLabels: Array.isArray(o.reservedSeatShortLabels)
        ? o.reservedSeatShortLabels.map(String)
        : [],
      pendingLayoutItemIds: Array.isArray(o.pendingLayoutItemIds)
        ? o.pendingLayoutItemIds.map(String)
        : [],
      paidSeatHolders: Array.isArray(o.paidSeatHolders)
        ? (o.paidSeatHolders as Record<string, unknown>[]).map((h) => ({
            layoutItemId: String(h.layoutItemId ?? ""),
            customerName: String(h.customerName ?? ""),
          }))
        : [],
    },
  };
}
