import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { BoxOfficeClassEventOption } from "../types/boxOfficeClasses.types";

type BookableClassEventsResponse = {
  events: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
};

export async function fetchBoxOfficeClassEvents(token: string): Promise<{
  ok: boolean;
  events: BoxOfficeClassEventOption[];
  message?: string;
}> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/upcoming-events/admin/bookable-class-events`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return { ok: false, events: [], message: "Could not reach the server." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not load class events.";
    return { ok: false, events: [], message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, events: [], message: "Invalid response." };
  }
  const row = data as BookableClassEventsResponse;
  const events = Array.isArray(row.events)
    ? row.events
        .map((event) => ({
          id: event.id,
          name: event.name,
          slug: event.slug ?? null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  return { ok: true, events };
}
