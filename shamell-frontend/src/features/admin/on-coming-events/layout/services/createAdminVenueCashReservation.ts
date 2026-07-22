import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { AdminCreateVenueReservationBody } from "./createAdminVenueCheckoutSession";

export async function createAdminVenueCashReservation(
  token: string,
  body: AdminCreateVenueReservationBody,
): Promise<
  | { ok: true; message: string; layoutItemId: string; customerName: string }
  | { ok: false; message: string }
> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${base}/api/v1/venue-reservations/admin/cash`, {
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
        : "Could not confirm cash reservation.";
    return { ok: false, message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, message: "Invalid response." };
  }
  const o = data as Record<string, unknown>;
  const reservation =
    o.reservation && typeof o.reservation === "object"
      ? (o.reservation as Record<string, unknown>)
      : null;
  return {
    ok: true,
    message: typeof o.message === "string" ? o.message : "Cash reservation confirmed.",
    layoutItemId: String(reservation?.layoutItemId ?? body.layoutItemId),
    customerName: String(reservation?.customerName ?? body.customerName),
  };
}
