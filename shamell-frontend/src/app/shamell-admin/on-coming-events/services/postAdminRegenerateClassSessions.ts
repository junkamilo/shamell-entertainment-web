import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export async function postAdminRegenerateClassSessions(
  token: string,
  eventId: string,
): Promise<{ ok: boolean; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/sessions/regenerate`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not generate class sessions.";
    return { ok: false, message: msg };
  }
  return { ok: true };
}
