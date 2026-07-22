import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import {
  RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
  reservationEventTemplateAdminFetch,
} from "./reservationEventTemplateAdminRequest";

export async function deleteAdminReservationEventTemplate(
  token: string,
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  const response = await reservationEventTemplateAdminFetch(`/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response) {
    return { ok: false, message: RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg = nestApiErrorMessage(data, "Could not delete reservation event.");
    return { ok: false, message: msg };
  }
  return { ok: true };
}
