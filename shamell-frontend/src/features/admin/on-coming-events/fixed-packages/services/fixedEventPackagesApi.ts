import { getAdminApiBaseUrl } from "@/lib/admin/apiBaseUrl";
import type {
  AdminEventActivity,
  AdminFixedEventPackage,
  EventActivityForm,
} from "../types/fixedEventPackage.types";

export async function fetchEventActivities(
  token: string,
  eventId: string,
): Promise<{ ok: boolean; activities: AdminEventActivity[] }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/activities`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok) return { ok: false, activities: [] };
  const data = (await response.json()) as { activities?: AdminEventActivity[] };
  return { ok: true, activities: data.activities ?? [] };
}

export async function replaceEventActivities(
  token: string,
  eventId: string,
  activities: EventActivityForm[],
): Promise<{ ok: boolean; message?: string; activities: AdminEventActivity[] }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/activities`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activities: activities.map((a, index) => ({
          ...(a.id ? { id: a.id } : {}),
          title: a.title.trim(),
          description: a.description.trim(),
          accentColor: a.accentColor.trim() || null,
          showText: a.showText !== false,
          displayOrder: a.displayOrder ?? index,
          isActive: a.isActive ?? true,
        })),
      }),
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not save activities.";
    return { ok: false, message: msg, activities: [] };
  }
  const parsed = data as { activities?: AdminEventActivity[] };
  return { ok: true, activities: parsed.activities ?? [] };
}

export async function postEventActivityMedia(
  token: string,
  eventId: string,
  activityId: string,
  file: File,
): Promise<{ ok: boolean; message?: string; activity?: AdminEventActivity }> {
  const base = getAdminApiBaseUrl();
  const fd = new FormData();
  fd.append("media", file);
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/activities/${activityId}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not upload activity media.";
    return { ok: false, message: msg };
  }
  return { ok: true, activity: data as AdminEventActivity };
}

export async function deleteEventActivityMedia(
  token: string,
  eventId: string,
  activityId: string,
): Promise<{ ok: boolean; message?: string; activity?: AdminEventActivity }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/activities/${activityId}/media`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not remove activity media.";
    return { ok: false, message: msg };
  }
  return { ok: true, activity: data as AdminEventActivity };
}

export async function fetchFixedEventPackages(
  token: string,
  eventId: string,
): Promise<{ ok: boolean; packages: AdminFixedEventPackage[] }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/fixed-packages`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!response.ok) return { ok: false, packages: [] };
  const data = (await response.json()) as { packages?: AdminFixedEventPackage[] };
  return { ok: true, packages: data.packages ?? [] };
}

export async function createFixedEventPackage(
  token: string,
  eventId: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string; pkg?: AdminFixedEventPackage }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/fixed-packages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not save package.";
    return { ok: false, message: msg };
  }
  return { ok: true, pkg: data as AdminFixedEventPackage };
}

export async function updateFixedEventPackage(
  token: string,
  eventId: string,
  packageId: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; message?: string; pkg?: AdminFixedEventPackage }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/fixed-packages/${packageId}`,
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
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: unknown }).message)
        : "Could not save package.";
    return { ok: false, message: msg };
  }
  return { ok: true, pkg: data as AdminFixedEventPackage };
}

export async function deleteFixedEventPackage(
  token: string,
  eventId: string,
  packageId: string,
): Promise<{ ok: boolean; message?: string }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(
    `${base}/api/v1/upcoming-events/admin/events/${eventId}/fixed-packages/${packageId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (response.ok) return { ok: true };
  const data: unknown = await response.json().catch(() => null);
  const msg =
    data && typeof data === "object" && "message" in data
      ? String((data as { message: unknown }).message)
      : "Could not delete package.";
  return { ok: false, message: msg };
}
