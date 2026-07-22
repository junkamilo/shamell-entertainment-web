import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { normalizeAdminAboutRow } from "../lib/aboutAdminUtils";
import type { AdminAboutRow } from "../types/aboutAdmin.types";

export type FetchAdminAboutResult = {
  ok: boolean;
  record: AdminAboutRow | null;
  data: unknown;
  status: number;
};

export async function fetchAdminAbout(token: string): Promise<FetchAdminAboutResult> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/about/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, record: null, data, status: response.status };
  }
  return {
    ok: true,
    record: normalizeAdminAboutRow(data),
    data,
    status: response.status,
  };
}
