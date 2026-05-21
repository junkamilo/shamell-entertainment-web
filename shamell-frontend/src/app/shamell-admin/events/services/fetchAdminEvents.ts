import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { mapAdminEventsFromApi } from "../lib/mapAdminEventFromApi";
import type { AdminEvent } from "../types/events.types";

export async function fetchAdminEvents(token: string): Promise<AdminEvent[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load events."));
  }
  return mapAdminEventsFromApi(data);
}
