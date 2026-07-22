import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export type AdminCreateVenueReservationBody = {
  kind: "catalog_table" | "standalone_chair";
  layoutItemId: string;
  venueTableConfigId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  upcomingEventSlug?: string;
};

export async function createAdminVenueCheckoutSession(
  token: string,
  body: AdminCreateVenueReservationBody,
): Promise<
  | { ok: true; reservationId: string; message: string; payUrl: string }
  | { ok: false; message: string }
> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1/venue-reservations/admin/checkout-session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not send payment link.";
    return { ok: false, message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, message: "Invalid response." };
  }
  const o = data as Record<string, unknown>;
  if (typeof o.reservationId !== "string") {
    return { ok: false, message: "Invalid response." };
  }
  return {
    ok: true,
    reservationId: o.reservationId,
    message: typeof o.message === "string" ? o.message : "Payment link sent.",
    payUrl: typeof o.payUrl === "string" ? o.payUrl : "",
  };
}
