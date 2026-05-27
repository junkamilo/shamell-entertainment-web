import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { TableSize } from "../types/venueTables.types";

type BulkDeletePayload =
  | { scope: "ALL" }
  | { scope: "SIZE"; size: TableSize };

export async function deleteAdminVenueTablesBulk(
  token: string,
  payload: BulkDeletePayload,
): Promise<{ ok: boolean; status: number; deletedCount?: number }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin/bulk`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data: unknown = await response.json().catch(() => null);
  const deletedCount =
    data && typeof data === "object" && "deletedCount" in data
      ? Number((data as { deletedCount?: unknown }).deletedCount ?? 0)
      : undefined;

  return { ok: response.ok, status: response.status, deletedCount };
}
