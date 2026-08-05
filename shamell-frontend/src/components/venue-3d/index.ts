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

export { useVenueSceneLayout } from "./useVenueSceneLayout";
export type { VenueSceneLayoutVariant } from "./useVenueSceneLayout";

export {
  layoutToWorld,
  worldToLayout,
  clientToLayout,
} from "./layoutCoords3d";

export {
  WORLD_WIDTH,
  WORLD_DEPTH,
  resolveCameraPresetForAspect,
  resolveAdminCameraPreset,
  ASPECT_NARROW_MAX,
  ASPECT_WIDE_MIN,
  CAMERA_PRESETS_BY_BUCKET,
  CAMERA_PRESET_ADMIN,
} from "./venueSceneConstants";
export type {
  VenueSceneLayoutBucket,
  VenueCameraPreset,
} from "./venueSceneConstants";

export {
  DEFAULT_FLOOR_SCENE_ZONES,
  SCENE_STAGE_SELECT_ID,
  SCENE_CARPET_SELECT_ID,
  isSceneSelectId,
  mergeFloorSceneZones,
} from "./floorSceneZonesDefaults";

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
