import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { mapEventTypesFromApi } from "../lib/mapEventTypeFromApi";
import type { EventTypeItem } from "../types/eventTypes.types";

export async function fetchAdminEventTypes(token: string): Promise<EventTypeItem[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/types/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load event types."));
  }
  return mapEventTypesFromApi(data);
}
