import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseAgregarAdminError } from "../lib/agregarAdminErrors";
import { getAgregarAdminAuthHeaders } from "../lib/agregarAdminAuth";
import type { AdminInvitePayload } from "../types/agregarAdmin.types";

export async function postAdminInvite(payload: AdminInvitePayload): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/auth/admin/invite`, {
    method: "POST",
    headers: getAgregarAdminAuthHeaders(),
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseAgregarAdminError(data, "Check the details or server configuration."));
  }
}
