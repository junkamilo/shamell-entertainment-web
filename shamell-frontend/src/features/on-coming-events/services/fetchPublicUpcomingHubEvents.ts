import { mapPublicUpcomingHubEvents } from "@/lib/on-coming-events/mapPublicUpcomingHubEvents";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import type { OnComingEventHubCardItem } from "../components/OnComingEventHubCard";

export async function fetchPublicUpcomingHubEvents(): Promise<
  OnComingEventHubCardItem[]
> {
  const base = getPublicApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/events?publicSection=UPCOMING_EVENTS`,
    { cache: "no-store" },
  );
  if (!response.ok) return [];
  const data: unknown = await response.json().catch(() => []);
  return mapPublicUpcomingHubEvents(data);
}
