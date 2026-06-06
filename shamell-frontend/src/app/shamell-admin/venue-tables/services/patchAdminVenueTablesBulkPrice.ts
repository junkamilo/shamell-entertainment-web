import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { TableSize } from "../types/venueTables.types";

type BulkPricePayload = {
  scope: "SIZE";
  size: TableSize;
  bundlePrice: number;
};

export async function patchAdminVenueTablesBulkPrice(
  token: string,
  payload: BulkPricePayload,
): Promise<{ ok: boolean; status: number; updatedCount?: number; data: unknown }> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin/bulk-price`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data: unknown = await response.json().catch(() => null);
  const updatedCount =
    data && typeof data === "object" && "updatedCount" in data
      ? Number((data as { updatedCount?: unknown }).updatedCount ?? 0)
      : undefined;

  return { ok: response.ok, status: response.status, updatedCount, data };
}
