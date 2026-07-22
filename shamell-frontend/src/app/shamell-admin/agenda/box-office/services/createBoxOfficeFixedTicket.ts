import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { BoxOfficeDetailsPayload } from "../types/boxOfficeFixed.types";

export type BoxOfficeFixedTicketBody = {
  upcomingEventId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  boxOfficeDetails: BoxOfficeDetailsPayload;
};

export async function createBoxOfficeFixedTicketCash(
  token: string,
  body: BoxOfficeFixedTicketBody,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/upcoming-events/admin/fixed-event-enrollments/cash`,
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
        : "Could not reserve ticket.";
    return { ok: false, message: msg };
  }
  return {
    ok: true,
    message:
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? String((data as { message: string }).message)
        : "Ticket reserved.",
  };
}

export async function createBoxOfficeFixedTicketCheckout(
  token: string,
  body: BoxOfficeFixedTicketBody,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/upcoming-events/admin/fixed-event-enrollments/checkout-session`,
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
