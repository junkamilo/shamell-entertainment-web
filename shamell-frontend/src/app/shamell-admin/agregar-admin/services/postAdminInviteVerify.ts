import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseAgregarAdminError } from "../lib/agregarAdminErrors";
import type { AdminInviteVerifyPayload } from "../types/agregarAdmin.types";

export async function postAdminInviteVerify(payload: AdminInviteVerifyPayload): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/auth/admin/invite/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      parseAgregarAdminError(data, "Wrong or expired code, or email already registered."),
    );
  }
}
