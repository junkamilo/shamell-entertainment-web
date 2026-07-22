import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { BoxOfficeFixedEvent } from "../types/boxOfficeFixed.types";

export async function fetchBoxOfficeFixedEvents(
  token: string,
): Promise<BoxOfficeFixedEvent[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/box-office/fixed-events`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      nestApiErrorMessage(data, "Could not load Box Office events."),
    );
  }
  const events =
    data && typeof data === "object" && Array.isArray((data as { events?: unknown }).events)
      ? (data as { events: Record<string, unknown>[] }).events
      : [];
  return events.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: typeof row.slug === "string" ? row.slug : null,
    purchaseKind:
      row.purchaseKind === "fixed_ticket" ? "fixed_ticket" : "venue_seating",
    price: typeof row.price === "number" ? row.price : row.price != null ? Number(row.price) : null,
    currency: typeof row.currency === "string" ? row.currency : "usd",
    ticketsRemaining:
      typeof row.ticketsRemaining === "number" ? row.ticketsRemaining : null,
    fixedTicketCapacity:
      typeof row.fixedTicketCapacity === "number"
        ? row.fixedTicketCapacity
        : null,
    floorLayoutId:
      typeof row.floorLayoutId === "string" ? row.floorLayoutId : null,
    eventDateIso: typeof row.eventDateIso === "string" ? row.eventDateIso : null,
    eventLabel: typeof row.eventLabel === "string" ? row.eventLabel : null,
  }));
}
