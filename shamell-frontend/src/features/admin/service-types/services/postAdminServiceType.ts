import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseServiceTypesError } from "../lib/serviceTypesErrors";
import type { UpsertServiceTypeBody } from "../types/serviceTypes.types";

export async function postAdminServiceType(
  token: string,
  body: UpsertServiceTypeBody,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/services/types/admin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseServiceTypesError(data, "Could not save service type."));
  }
}
