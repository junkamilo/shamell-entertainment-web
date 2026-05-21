import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseServicesError } from "../lib/servicesErrors";

export async function patchAdminServiceActive(
  token: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const base = getAdminApiBaseUrl();
  const form = new FormData();
  form.append("isActive", String(isActive));
  const response = await fetch(`${base}/api/v1/services/admin/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseServicesError(data, "Could not update service status."));
  }
}
