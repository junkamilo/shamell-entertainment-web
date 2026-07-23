import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { CreatePrivateClassBookingBody } from "../types/privateClass.types";

type Success = {
  ok: true;
  bookingId: string;
  message: string;
  quoteId?: string;
};
type Failure = { ok: false; message: string };

async function postPrivateClass(
  token: string,
  path: "cash" | "checkout-session",
  body: CreatePrivateClassBookingBody,
): Promise<Success | Failure> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/bookings/admin/private-class/${path}`,
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
        : "Request failed.";
    return { ok: false, message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, message: "Invalid response." };
  }
  const row = data as Record<string, unknown>;
  if (typeof row.bookingId !== "string") {
    return { ok: false, message: "Invalid response." };
  }
  return {
    ok: true,
    bookingId: row.bookingId,
    message: typeof row.message === "string" ? row.message : "Done.",
    quoteId: typeof row.quoteId === "string" ? row.quoteId : undefined,
  };
}

export function createPrivateClassCash(
  token: string,
  body: CreatePrivateClassBookingBody,
) {
  return postPrivateClass(token, "cash", body);
}

export function createPrivateClassCheckoutSession(
  token: string,
  body: CreatePrivateClassBookingBody,
) {
  return postPrivateClass(token, "checkout-session", body);
}
