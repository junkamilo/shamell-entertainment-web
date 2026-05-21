import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { CreateAdminEventBody } from "../types/events.types";

export type PostAdminEventResult = {
  id?: string;
};

export async function postAdminEvent(
  token: string,
  body: CreateAdminEventBody,
): Promise<PostAdminEventResult> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/admin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not save the event."));
  }
  const payload = data as { event?: { id?: string } };
  return { id: payload.event?.id ? String(payload.event.id) : undefined };
}
