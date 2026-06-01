import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapStandaloneChairFromApi } from "../lib/mapStandaloneChairFromApi";
import type { StandaloneChairConfig } from "../types/standaloneChairs.types";

export async function deleteAdminStandaloneChair(
  token: string,
  id: string,
): Promise<{
  ok: boolean;
  config: StandaloneChairConfig | null;
  data: unknown;
  status: number;
}> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/standalone-chairs/admin/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  return {
    ok: response.ok,
    config: response.ok ? mapStandaloneChairFromApi(data) : null,
    data,
    status: response.status,
  };
}
