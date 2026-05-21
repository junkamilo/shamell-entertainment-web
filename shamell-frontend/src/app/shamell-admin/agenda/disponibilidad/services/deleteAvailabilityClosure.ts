import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { getDisponibilidadAuthHeaders } from "../lib/disponibilidadAuth";

export async function deleteAvailabilityClosure(id: string): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/availability/admin/closures/${id}`, {
    method: "DELETE",
    headers: getDisponibilidadAuthHeaders(),
    cache: "no-store",
  });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => ({}));
    throw new Error(nestApiErrorMessage(data, "Could not delete."));
  }
}
