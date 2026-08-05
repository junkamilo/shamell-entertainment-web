export { default as VenueScene3D } from "./scene/VenueScene3D";
export type { VenueScene3DHandle, VenueScene3DProps } from "./scene/VenueScene3D/VenueScene3D";

export { default as PlacedItemsLayer } from "./items/PlacedItemsLayer";
export type { PlacedItemsLayerProps } from "./items/PlacedItemsLayer/PlacedItemsLayer";

export { default as VenueSceneLegend } from "./room/VenueSceneLegend";
export type { VenueSceneLegendProps } from "./room/VenueSceneLegend/VenueSceneLegend";

export type { CatalogTableMeshProps } from "./items/CatalogTableMesh/CatalogTableMesh";
export type { StandaloneChairMeshProps } from "./items/StandaloneChairMesh/StandaloneChairMesh";

export {
  VenueSceneCanvasContext,
  useVenueSceneCanvas,
} from "./scene/VenueSceneCanvasContext";
export type { VenueSceneCanvasContextValue } from "./scene/VenueSceneCanvasContext";

export {
  FloorSceneZonesProvider,
  useFloorSceneZones,
} from "./scene/FloorSceneZonesContext";

export { useVenueSceneLayout } from "./lib/useVenueSceneLayout";
export type { VenueSceneLayoutVariant } from "./lib/useVenueSceneLayout";

export {
  layoutToWorld,
  worldToLayout,
  clientToLayout,
} from "./lib/layoutCoords3d";

export {
  WORLD_WIDTH,
  WORLD_DEPTH,
  resolveCameraPresetForAspect,
  resolveAdminCameraPreset,
  ASPECT_NARROW_MAX,
  ASPECT_WIDE_MIN,
  CAMERA_PRESETS_BY_BUCKET,
  CAMERA_PRESET_ADMIN,
} from "./lib/venueSceneConstants";
export type {
  VenueSceneLayoutBucket,
  VenueCameraPreset,
} from "./lib/venueSceneConstants";

export {
  DEFAULT_FLOOR_SCENE_ZONES,
  SCENE_STAGE_SELECT_ID,
  SCENE_CARPET_SELECT_ID,
  isSceneSelectId,
  mergeFloorSceneZones,
} from "./lib/floorSceneZonesDefaults";

export { CHAIR_SILHOUETTE_PATH } from "./chair/lib/chairSilhouettePath";

export {
  carpetZoneFromStage,
  STAGE_DEPTH,
  STAGE_WIDTH,
  STAIR_COUNT,
  STAIR_DEPTH,
  STAGE_ZONE_POSITION,
  STAGE_ZONE_ROTATION_Y,
} from "./stage/stageConstants";
