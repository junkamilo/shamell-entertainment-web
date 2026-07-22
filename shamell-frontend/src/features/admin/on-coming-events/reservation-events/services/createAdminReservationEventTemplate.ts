import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type {
  ReservationEventTemplate,
  ReservationEventTemplateBody,
} from "../types/reservationEventTemplate.types";
import {
  RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
  reservationEventTemplateAdminFetch,
} from "./reservationEventTemplateAdminRequest";

export async function createAdminReservationEventTemplate(
  token: string,
  body: ReservationEventTemplateBody,
): Promise<{ ok: boolean; template: ReservationEventTemplate | null; message?: string }> {
  const response = await reservationEventTemplateAdminFetch("/admin", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response) {
    return { ok: false, template: null, message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object" || !("id" in data)) {
    const msg = nestApiErrorMessage(data, "Could not create reservation event.");
    return { ok: false, template: null, message: msg };
  }
  return { ok: true, template: data as ReservationEventTemplate };
}
