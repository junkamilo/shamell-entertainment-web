import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";

export type SalesClosedReason =
  | "not_configured"
  | "not_started"
  | "ended"
  | "sold_out";

export type PaidSeatHolder = {
  layoutItemId: string;
  customerName: string;
};

export type VenueReservationAvailability = {
  eventDate: string | null;
  reservationOpensAt: string | null;
  reservationClosesAt: string | null;
  reservationsOpen: boolean;
  salesClosedReason: SalesClosedReason | null;
  reservedLayoutItemIds: string[];
  reservedVenueTableConfigIds: string[];
  reservedSeatShortLabels: string[];
  paidSeatHolders: PaidSeatHolder[];
};

const emptyAvailability: VenueReservationAvailability = {
  eventDate: null,
  reservationOpensAt: null,
  reservationClosesAt: null,
  reservationsOpen: false,
  salesClosedReason: "not_configured",
  reservedLayoutItemIds: [],
  reservedVenueTableConfigIds: [],
  reservedSeatShortLabels: [],
  paidSeatHolders: [],
};

export async function fetchVenueReservationAvailability(
  upcomingEventSlug?: string,
): Promise<VenueReservationAvailability> {
  const base = getPublicApiBaseUrl();
  const params = new URLSearchParams();
  if (upcomingEventSlug) params.set("upcomingEventSlug", upcomingEventSlug);
  const query = params.toString();
  const response = await fetch(
    `${base}/api/v1/venue-reservations/availability${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );
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
    reservedSeatShortLabels: Array.isArray(o.reservedSeatShortLabels)
      ? o.reservedSeatShortLabels.filter((label): label is string => typeof label === "string")
      : [],
    paidSeatHolders: Array.isArray(o.paidSeatHolders)
      ? o.paidSeatHolders
          .filter(
            (row): row is PaidSeatHolder =>
              row != null &&
              typeof row === "object" &&
              typeof (row as PaidSeatHolder).layoutItemId === "string" &&
              typeof (row as PaidSeatHolder).customerName === "string",
          )
          .map((row) => ({
            layoutItemId: row.layoutItemId,
            customerName: row.customerName.trim() || "Guest",
          }))
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
