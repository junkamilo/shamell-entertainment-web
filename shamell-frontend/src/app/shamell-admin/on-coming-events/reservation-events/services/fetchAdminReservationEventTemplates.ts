import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type {
  ReservationEventScheduleMode,
  ReservationEventTemplate,
} from "../types/reservationEventTemplate.types";
import {
  RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
  reservationEventTemplateAdminFetch,
} from "./reservationEventTemplateAdminRequest";

export async function fetchAdminReservationEventTemplates(
  token: string,
  scheduleMode?: ReservationEventScheduleMode,
): Promise<{ ok: boolean; templates: ReservationEventTemplate[]; message?: string }> {
  const query = scheduleMode ? `?scheduleMode=${scheduleMode}` : "";
  const response = await reservationEventTemplateAdminFetch(`/admin${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response) {
    return { ok: false, templates: [], message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !Array.isArray(data)) {
    const msg = nestApiErrorMessage(data, "Could not load reservation events.");
    return { ok: false, templates: [], message: msg };
  }
  return { ok: true, templates: data as ReservationEventTemplate[] };
}
