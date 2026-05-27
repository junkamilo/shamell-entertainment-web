import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapFloorLayoutPaletteFromApi } from "../lib/mapFloorLayoutFromApi";
import type { FloorLayoutPalette } from "../types/floorLayout.types";

export async function fetchAdminFloorLayoutPalette(token: string): Promise<{
  ok: boolean;
  palette: FloorLayoutPalette | null;
  status: number;
}> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/floor-layout/admin/palette`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    return { ok: false, palette: null, status: response.status };
  }
  const data: unknown = await response.json().catch(() => null);
  return {
    ok: true,
    palette: mapFloorLayoutPaletteFromApi(data),
    status: response.status,
  };
}
