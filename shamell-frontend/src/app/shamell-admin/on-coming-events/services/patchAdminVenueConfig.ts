import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export type AdminVenueConfig = {
  id: string;
  eventId: string;
  clientEnabled: boolean;
  reservationEventTemplateId: string | null;
  reservationEventLabel: string | null;
  reservationOpensAt: string | null;
  reservationClosesAt: string | null;
  reservationEventTemplate: {
    id: string;
    name: string;
    summary?: string;
  } | null;
};

export async function patchAdminVenueConfig(
  token: string,
  eventId: string,
  body: {
    reservationEventTemplateId?: string | null;
    clientEnabled?: boolean;
  },
): Promise<{ ok: boolean; config: AdminVenueConfig | null; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/venue-config`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || !data || typeof data !== "object" || !("eventId" in data)) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not save venue config.";
    return { ok: false, config: null, message: msg };
  }
  return { ok: true, config: data as AdminVenueConfig };
}

export async function fetchAdminVenueConfig(
  token: string,
  eventId: string,
): Promise<{ ok: boolean; config: AdminVenueConfig | null; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/venue-config`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, config: null };
  }
  if (data === null) {
    return { ok: true, config: null };
  }
  return { ok: true, config: data as AdminVenueConfig };
}
