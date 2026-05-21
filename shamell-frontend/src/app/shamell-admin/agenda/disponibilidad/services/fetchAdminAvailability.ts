import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { AdminAvailabilitySnapshot } from "../types/disponibilidad.types";

export async function fetchAdminAvailability(token: string): Promise<AdminAvailabilitySnapshot> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/availability/admin`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load availability."));
  }
  return data as AdminAvailabilitySnapshot;
}
