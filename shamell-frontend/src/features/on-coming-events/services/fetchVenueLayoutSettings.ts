import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import type { OnComingEventsPromo } from "@/hooks/use-on-coming-events-settings";

export async function fetchOnComingEventsSettings(): Promise<OnComingEventsPromo | null> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/on-coming-events/settings`, { cache: "no-store" });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  return {
    clientEnabled: Boolean(o.clientEnabled),
    promoTitle: typeof o.promoTitle === "string" ? o.promoTitle : null,
    promoDescription: typeof o.promoDescription === "string" ? o.promoDescription : null,
    promoImageUrl: typeof o.promoImageUrl === "string" ? o.promoImageUrl : null,
    reservationEventDate:
      typeof o.reservationEventDate === "string" ? o.reservationEventDate : null,
    reservationOpensAt:
      typeof o.reservationOpensAt === "string" ? o.reservationOpensAt : null,
    reservationClosesAt:
      typeof o.reservationClosesAt === "string" ? o.reservationClosesAt : null,
    reservationEventLabel:
      typeof o.reservationEventLabel === "string" ? o.reservationEventLabel : null,
    reservationTimezone:
      typeof o.reservationTimezone === "string" ? o.reservationTimezone : "America/New_York",
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : null,
  };
}

/** @deprecated Use fetchOnComingEventsSettings */
export const fetchVenueLayoutSettings = fetchOnComingEventsSettings;
