import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export type ClassSessionPublic = {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: number;
  price: number;
  currency: string;
  seatsRemaining: number;
};

export async function fetchUpcomingClassSessions(slug: string) {
  const base = getPublicApiBaseUrl();
  const response = await fetch(`${base}/api/v1/upcoming-events/${encodeURIComponent(slug)}/sessions`, {
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object") {
    throw new Error("Could not load class sessions.");
  }
  return data as {
    event: { eventTypeName: string; slug: string; description: string };
    sessions: ClassSessionPublic[];
  };
}
