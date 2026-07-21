import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { BookClassEventOption } from "../types/bookClass.types";

type BookableClassEventsResponse = {
  events: Array<{
    id: string;
    name: string;
    slug: string;
    timezone: string;
    weekdayCount: number;
    sectionCount: number;
    upcomingSessionCount: number;
  }>;
};

export async function fetchBookClassEventsCatalog(
  token: string,
): Promise<BookClassEventOption[]> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/bookable-class-events`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not load class events.";
    throw new Error(msg);
  }
  if (!data || typeof data !== "object") {
    throw new Error("Invalid class events response.");
  }
  const row = data as BookableClassEventsResponse;
  if (!Array.isArray(row.events)) {
    return [];
  }
  return row.events
    .map((event) => ({
      id: event.id,
      name: event.name,
      slug: event.slug ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchBookClassEventContext(
  token: string,
  eventId: string,
): Promise<import("../types/bookClass.types").BookClassEventContext> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${encodeURIComponent(eventId)}/class-booking-context`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not load class event.";
    throw new Error(msg);
  }
  if (!data || typeof data !== "object") {
    throw new Error("Invalid class event response.");
  }
  return data as import("../types/bookClass.types").BookClassEventContext;
}
