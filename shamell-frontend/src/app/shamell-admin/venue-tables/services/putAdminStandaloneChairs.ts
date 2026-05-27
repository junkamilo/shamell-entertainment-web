import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapStandaloneChairFromApi } from "../lib/mapStandaloneChairFromApi";
import type {
  StandaloneChairConfig,
  StandaloneChairConfigPayload,
} from "../types/standaloneChairs.types";

export async function putAdminStandaloneChairs(
  token: string,
  payload: StandaloneChairConfigPayload,
): Promise<{
  ok: boolean;
  config: StandaloneChairConfig | null;
  data: unknown;
  status: number;
}> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/standalone-chairs/admin`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
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
