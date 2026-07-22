import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { BoxOfficeDetailsPayload } from "../types/boxOfficeFixed.types";

export type BoxOfficeVenueReserveBody = {
  kind: "catalog_table" | "standalone_chair";
  layoutItemId: string;
  venueTableConfigId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  upcomingEventId: string;
  upcomingEventSlug?: string;
  boxOfficeDetails: BoxOfficeDetailsPayload;
};

export async function createBoxOfficeVenueCash(
  token: string,
  body: BoxOfficeVenueReserveBody,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
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
  return {
    ok: true,
    message:
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? String((data as { message: string }).message)
        : "Cash reservation confirmed.",
  };
}

export async function createBoxOfficeVenueCheckout(
  token: string,
  body: BoxOfficeVenueReserveBody,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/venue-reservations/admin/checkout-session`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
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
  return {
    ok: true,
    message:
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? String((data as { message: string }).message)
        : "Payment link sent to customer.",
  };
}
