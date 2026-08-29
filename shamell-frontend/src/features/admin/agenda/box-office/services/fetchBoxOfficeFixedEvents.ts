import { getAdminApiBaseUrl } from "@/lib/admin/apiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type {
  BoxOfficeFixedEvent,
  BoxOfficeFixedPackage,
} from "../types/boxOfficeFixed.types";

function mapPackage(row: unknown): BoxOfficeFixedPackage | null {
  if (!row || typeof row !== "object") return null;
  const p = row as Record<string, unknown>;
  if (typeof p.id !== "string" || !p.id.trim()) return null;
  const price =
    typeof p.price === "number"
      ? p.price
      : p.price != null
        ? Number(p.price)
        : NaN;
  if (!Number.isFinite(price)) return null;
  return {
    id: p.id,
    title: typeof p.title === "string" ? p.title : "",
    price,
    capacity: typeof p.capacity === "number" ? p.capacity : 0,
    sold: typeof p.sold === "number" ? p.sold : 0,
    remaining: typeof p.remaining === "number" ? p.remaining : 0,
  };
}

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
  return events.map((row) => {
    const rawPackages = Array.isArray(row.packages) ? row.packages : [];
    const packages = rawPackages
      .map(mapPackage)
      .filter((p): p is BoxOfficeFixedPackage => p != null);
    return {
      id: String(row.id),
      name: String(row.name ?? ""),
      slug: typeof row.slug === "string" ? row.slug : null,
      purchaseKind:
        row.purchaseKind === "fixed_ticket" ? "fixed_ticket" : "venue_seating",
      ticketMode: row.ticketMode === "PACKAGES" ? "PACKAGES" : "SINGLE",
      price:
        typeof row.price === "number"
          ? row.price
          : row.price != null
            ? Number(row.price)
            : null,
      currency: typeof row.currency === "string" ? row.currency : "usd",
      ticketsRemaining:
        typeof row.ticketsRemaining === "number" ? row.ticketsRemaining : null,
      fixedTicketCapacity:
        typeof row.fixedTicketCapacity === "number"
          ? row.fixedTicketCapacity
          : null,
      packages,
      floorLayoutId:
        typeof row.floorLayoutId === "string" ? row.floorLayoutId : null,
      eventDateIso:
        typeof row.eventDateIso === "string" ? row.eventDateIso : null,
      eventLabel: typeof row.eventLabel === "string" ? row.eventLabel : null,
    };
  });
}
