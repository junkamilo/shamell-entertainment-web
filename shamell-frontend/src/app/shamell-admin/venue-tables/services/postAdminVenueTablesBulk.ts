import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapVenueTablesListFromApi } from "../lib/mapVenueTableFromApi";
import type {
  BulkCreateVenueTablesResult,
  BulkVenueTablePayload,
} from "../types/venueTables.types";

export async function postAdminVenueTablesBulk(
  token: string,
  payload: BulkVenueTablePayload,
): Promise<{
  ok: boolean;
  result: BulkCreateVenueTablesResult | null;
  data: unknown;
  status: number;
}> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/venue-tables/admin/bulk`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, result: null, data, status: response.status };
  }
  const created = mapVenueTablesListFromApi(
    data && typeof data === "object" && "created" in data
      ? (data as { created: unknown }).created
      : [],
  );
  const count =
    data && typeof data === "object" && typeof (data as { count?: unknown }).count === "number"
      ? (data as { count: number }).count
      : created.length;
  return {
    ok: true,
    result: { created, count },
    data,
    status: response.status,
  };
}
