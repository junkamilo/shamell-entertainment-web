import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { UpsertEventTypeBody } from "../types/eventTypes.types";

export async function patchAdminEventType(
  token: string,
  id: string,
  body: UpsertEventTypeBody,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/types/admin/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not save event type."));
  }
}

export async function patchAdminEventTypeActive(
  token: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/types/admin/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not update event type status."));
  }
}
