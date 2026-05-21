import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { getDisponibilidadAuthHeaders } from "../lib/disponibilidadAuth";
import type { CreateClosurePayload } from "../types/disponibilidad.types";

export async function createAvailabilityClosure(body: CreateClosurePayload): Promise<unknown> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/availability/admin/closures`, {
    method: "POST",
    headers: getDisponibilidadAuthHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not create closure."));
  }
  return data;
}
