import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { mapEventTypesFromApi } from "@/app/shamell-admin/event-types/lib/mapEventTypeFromApi";
import type { EventsEventTypeOption, EventPublicSection } from "../types/events.types";

export async function fetchAdminEventTypesForEvents(
  token: string,
  options?: { publicSection?: EventPublicSection },
): Promise<EventsEventTypeOption[]> {
  const base = getAdminApiBaseUrl();
  const params = new URLSearchParams();
  if (options?.publicSection) {
    params.set("publicSection", options.publicSection);
  }
  const query = params.toString();
  const url = `${base}/api/v1/events/types/admin${query ? `?${query}` : ""}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => []);
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load event types."));
  }
  const types = mapEventTypesFromApi(data);
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    isActive: t.isActive,
  }));
}
