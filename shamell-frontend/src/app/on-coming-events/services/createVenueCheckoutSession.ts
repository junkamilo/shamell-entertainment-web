import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type CreateCheckoutSessionBody = {
  kind: "catalog_table" | "standalone_chair";
  layoutItemId: string;
  venueTableConfigId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  upcomingEventSlug?: string;
};

export async function createVenueCheckoutSession(
  body: CreateCheckoutSessionBody,
): Promise<{ ok: true; clientSecret: string; reservationId: string } | { ok: false; message: string }> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-reservations/checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not start checkout.";
    return { ok: false, message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, message: "Invalid checkout response." };
  }
  const o = data as Record<string, unknown>;
  if (typeof o.clientSecret !== "string" || typeof o.reservationId !== "string") {
    return { ok: false, message: "Invalid checkout response." };
  }
  return { ok: true, clientSecret: o.clientSecret, reservationId: o.reservationId };
}
