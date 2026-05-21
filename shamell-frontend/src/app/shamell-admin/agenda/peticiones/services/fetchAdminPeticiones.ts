import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { DEFAULT_PAGINATION_META, type PaginatedResponse, type PaginationMeta } from "@/lib/pagination";
import type { AdminPeticionesQuery, UnifiedPeticionRow } from "../types/peticiones.types";

export type FetchAdminPeticionesResult = {
  items: UnifiedPeticionRow[];
  meta: PaginationMeta;
};

export async function fetchAdminPeticiones(
  token: string,
  query?: AdminPeticionesQuery,
): Promise<FetchAdminPeticionesResult> {
  const base = getAdminApiBaseUrl();
  const sp = new URLSearchParams();
  if (query?.page) sp.set("page", String(query.page));
  if (query?.perPage) sp.set("perPage", String(query.perPage));
  if (query?.lane) sp.set("lane", query.lane);
  const qs = sp.size ? `?${sp.toString()}` : "";

  const response = await fetch(`${base}/api/v1/contact/peticiones${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(nestApiErrorMessage(data, "Could not load inbox items."));
  }

  const payload = data as Partial<PaginatedResponse<UnifiedPeticionRow>>;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const nextMeta = payload.meta ?? DEFAULT_PAGINATION_META;

  return {
    items,
    meta: {
      page: Number(nextMeta.page ?? 1),
      perPage: Number(nextMeta.perPage ?? query?.perPage ?? 10),
      totalItems: Number(nextMeta.totalItems ?? items.length),
      totalPages: Number(nextMeta.totalPages ?? 1),
      hasPrev: Boolean(nextMeta.hasPrev),
      hasNext: Boolean(nextMeta.hasNext),
    },
  };
}
