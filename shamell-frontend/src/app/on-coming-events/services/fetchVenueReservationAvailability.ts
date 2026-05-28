import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type SalesClosedReason =
  | "not_configured"
  | "not_started"
  | "ended"
  | "sold_out";

export type VenueReservationAvailability = {
  eventDate: string | null;
  reservationOpensAt: string | null;
  reservationClosesAt: string | null;
  reservationsOpen: boolean;
  salesClosedReason: SalesClosedReason | null;
  reservedLayoutItemIds: string[];
  reservedVenueTableConfigIds: string[];
};

const emptyAvailability: VenueReservationAvailability = {
  eventDate: null,
  reservationOpensAt: null,
  reservationClosesAt: null,
  reservationsOpen: false,
  salesClosedReason: "not_configured",
  reservedLayoutItemIds: [],
  reservedVenueTableConfigIds: [],
};

export async function fetchVenueReservationAvailability(): Promise<VenueReservationAvailability> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-reservations/availability`, {
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") {
    return emptyAvailability;
  }
  const o = data as Record<string, unknown>;
  const reason = o.salesClosedReason;
  const salesClosedReason =
    reason === "not_configured" ||
    reason === "not_started" ||
    reason === "ended" ||
    reason === "sold_out"
      ? reason
      : null;

  return {
    eventDate: typeof o.eventDate === "string" ? o.eventDate : null,
    reservationOpensAt:
      typeof o.reservationOpensAt === "string" ? o.reservationOpensAt : null,
    reservationClosesAt:
      typeof o.reservationClosesAt === "string" ? o.reservationClosesAt : null,
    reservationsOpen: Boolean(o.reservationsOpen),
    salesClosedReason,
    reservedLayoutItemIds: Array.isArray(o.reservedLayoutItemIds)
      ? o.reservedLayoutItemIds.filter((id): id is string => typeof id === "string")
      : [],
    reservedVenueTableConfigIds: Array.isArray(o.reservedVenueTableConfigIds)
      ? o.reservedVenueTableConfigIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}

export function salesClosedMessage(reason: SalesClosedReason | null): string {
  switch (reason) {
    case "not_started":
      return "Reservations are not open yet.";
    case "ended":
      return "Reservations have closed.";
    case "sold_out":
      return "All seats are sold.";
    case "not_configured":
      return "Reservations are not available.";
    default:
      return "Reservations are closed.";
  }
}
