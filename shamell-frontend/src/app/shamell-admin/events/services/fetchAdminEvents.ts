import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { mapAdminEventsFromApi } from "../lib/mapAdminEventFromApi";
import type { AdminEvent, EventPublicSection } from "../types/events.types";

export async function fetchAdminEvents(
  token: string,
  options?: { publicSection?: EventPublicSection },
): Promise<AdminEvent[]> {
  const base = getAdminApiBaseUrl();
  const params = new URLSearchParams();
  if (options?.publicSection) {
    params.set("publicSection", options.publicSection);
  }
  const query = params.toString();
  const url = `${base}/api/v1/events/admin${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load events."));
  }
  return mapAdminEventsFromApi(data);
}
