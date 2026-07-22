import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export const RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE =
  "Could not reach the server. Confirm the backend is running and NEXT_PUBLIC_BACKEND_URL matches its port (default http://localhost:3001).";

/** True when the browser blocked the request (offline, CORS, wrong URL). */
export function isReservationEventAdminNetworkError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : "";
  return message === "Failed to fetch" || !(err instanceof Error);
}

export async function reservationEventTemplateAdminFetch(
  path: string,
  init?: RequestInit,
): Promise<Response | null> {
  const base = getAdminApiBaseUrl();
  try {
    return await fetch(`${base}/api/v1/reservation-event-templates${path}`, {
      cache: "no-store",
      ...init,
    });
  } catch {
    return null;
  }
}
