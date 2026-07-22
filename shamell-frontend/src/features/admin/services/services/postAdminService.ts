import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { parseServicesError } from "../lib/servicesErrors";

export async function postAdminService(token: string, body: FormData): Promise<void> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/services/admin`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseServicesError(data, "Could not save the service."));
  }
}
