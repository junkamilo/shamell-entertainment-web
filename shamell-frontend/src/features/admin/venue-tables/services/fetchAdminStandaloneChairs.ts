import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapStandaloneChairFromApi } from "../lib/mapStandaloneChairFromApi";
import type { StandaloneChairConfig } from "../types/standaloneChairs.types";

export async function fetchAdminStandaloneChairs(token: string): Promise<{
  ok: boolean;
  config: StandaloneChairConfig | null;
  status: number;
}> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/standalone-chairs/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return { ok: false, config: null, status: response.status };
  }
  const data: unknown = await response.json().catch(() => null);
  return {
    ok: true,
    config: mapStandaloneChairFromApi(data),
    status: response.status,
  };
}
