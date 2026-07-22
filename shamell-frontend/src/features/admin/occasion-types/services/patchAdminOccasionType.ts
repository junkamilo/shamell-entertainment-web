import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseOccasionTypesError } from "../lib/occasionTypesErrors";
import type { UpsertOccasionTypeBody } from "../types/occasionTypes.types";

export async function patchAdminOccasionType(
  token: string,
  id: string,
  body: UpsertOccasionTypeBody,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/occasions/admin/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseOccasionTypesError(data, "Could not save."));
  }
}

export async function patchAdminOccasionTypeActive(
  token: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/occasions/admin/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ isActive }),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseOccasionTypesError(data, "Could not update."));
  }
}
