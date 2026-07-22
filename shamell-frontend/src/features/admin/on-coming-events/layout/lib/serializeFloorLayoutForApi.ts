import type { FloorSceneZones, PlacedLayoutItem } from "../types/floorLayout.types";

type SaveFloorLayoutPayload = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  backgroundVersion: string;
  items: PlacedLayoutItem[];
  sceneZones?: FloorSceneZones;
};

/**
 * API PUT accepts only PlacedLayoutItemDto fields (no read-only enrichments like unitPrice).
 * Client state may include unitPrice after GET; strip it before save.
 */
export function serializePlacedLayoutItemForApi(item: PlacedLayoutItem) {
  if (item.kind === "catalog_table") {
    return {
      id: item.id,
      kind: item.kind,
      venueTableConfigId: item.venueTableConfigId,
      tableName: item.tableName,
      size: item.size,
      includedChairs: item.includedChairs,
      x: item.x,
      y: item.y,
      rotation: item.rotation,
    };
  }

  return {
    id: item.id,
    kind: item.kind,
    venueStandaloneChairId: item.venueStandaloneChairId,
    chairName: item.chairName,
    x: item.x,
    y: item.y,
    rotation: item.rotation,
  };
}

export function serializeFloorLayoutPayloadForApi(payload: SaveFloorLayoutPayload) {
  return {
    viewBoxWidth: payload.viewBoxWidth,
    viewBoxHeight: payload.viewBoxHeight,
    backgroundVersion: payload.backgroundVersion,
    items: payload.items.map(serializePlacedLayoutItemForApi),
    ...(payload.sceneZones ? { sceneZones: payload.sceneZones } : {}),
  };
}
