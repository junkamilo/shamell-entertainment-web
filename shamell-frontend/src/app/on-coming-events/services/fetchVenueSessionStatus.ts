import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type VenueSessionStatus = {
  stripeStatus: "complete" | "open" | "expired";
  reservation: {
    id: string;
    kind: string;
    layoutItemId: string;
    tableName: string | null;
    seatDisplayLabel: string | null;
    status: string;
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    eventDate: string;
    paidAt: string | null;
  };
};

export async function fetchVenueSessionStatus(
  sessionId: string,
): Promise<VenueSessionStatus | null> {
  const base = getPublicApiBaseUrl();
  const params = new URLSearchParams({ session_id: sessionId });
  const response = await fetch(
    `${base}/api/v1/venue-reservations/session-status?${params}`,
    { cache: "no-store" },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.stripeStatus !== "string" || !o.reservation || typeof o.reservation !== "object") {
    return null;
  }
  const r = o.reservation as Record<string, unknown>;
  return {
    stripeStatus: o.stripeStatus as VenueSessionStatus["stripeStatus"],
    reservation: {
      id: String(r.id ?? ""),
      kind: String(r.kind ?? ""),
      layoutItemId: String(r.layoutItemId ?? ""),
      tableName: typeof r.tableName === "string" ? r.tableName : null,
      seatDisplayLabel:
        typeof r.seatDisplayLabel === "string" ? r.seatDisplayLabel : null,
      status: String(r.status ?? ""),
      amount: Number(r.amount ?? 0),
      currency: String(r.currency ?? "usd"),
      customerName: String(r.customerName ?? ""),
      customerEmail: String(r.customerEmail ?? ""),
      eventDate: String(r.eventDate ?? ""),
      paidAt: typeof r.paidAt === "string" ? r.paidAt : null,
    },
  };
}
