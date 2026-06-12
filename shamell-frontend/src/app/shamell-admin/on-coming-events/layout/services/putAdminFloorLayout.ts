import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import { mapFloorLayoutFromApi } from "../lib/mapFloorLayoutFromApi";
import { serializeFloorLayoutPayloadForApi } from "../lib/serializeFloorLayoutForApi";
import type {
  FloorSceneZones,
  PlacedLayoutItem,
  VenueFloorLayout,
} from "../types/floorLayout.types";

export type PutAdminFloorLayoutPayload = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: PlacedLayoutItem[];
  sceneZones?: FloorSceneZones;
};

export type PutAdminFloorLayoutResult = {
  ok: boolean;
  layout: VenueFloorLayout | null;
  data: unknown;
  status: number;
};

export async function putAdminFloorLayout(
  token: string,
  payload: PutAdminFloorLayoutPayload,
): Promise<PutAdminFloorLayoutResult> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/floor-layout/admin`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializeFloorLayoutPayloadForApi(payload)),
    cache: "no-store",
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, layout: null, data, status: response.status };
  }
  return {
    ok: true,
    layout: mapFloorLayoutFromApi(data),
    data,
    status: response.status,
  };
}
