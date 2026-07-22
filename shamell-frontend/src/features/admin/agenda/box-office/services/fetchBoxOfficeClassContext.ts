import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { BoxOfficeClassEventContext } from "../types/boxOfficeClasses.types";

export async function fetchBoxOfficeClassContext(
  token: string,
  eventId: string,
): Promise<{
  ok: boolean;
  context: BoxOfficeClassEventContext | null;
  message?: string;
}> {
  const base = getAdminApiBaseUrl();
  let response: Response;
  try {
    response = await fetch(
      `${base}/api/v1/upcoming-events/admin/events/${encodeURIComponent(eventId)}/class-booking-context`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return {
      ok: false,
      context: null,
      message: "Could not reach the server.",
    };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not load class event.";
    return { ok: false, context: null, message: msg };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, context: null, message: "Invalid response." };
  }
  return { ok: true, context: data as BoxOfficeClassEventContext };
}
