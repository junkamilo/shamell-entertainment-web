import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";
import type { AdminAvailabilitySnapshot } from "../types/disponibilidad.types";
import { getDisponibilidadAuthHeaders } from "../lib/disponibilidadAuth";

export async function putWeeklyAvailability(
  slots: PublicWeeklySlot[],
): Promise<AdminAvailabilitySnapshot> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/availability/admin/weekly`, {
    method: "PUT",
    headers: getDisponibilidadAuthHeaders(),
    body: JSON.stringify({ slots }),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not save."));
  }
  return data as AdminAvailabilitySnapshot;
}
