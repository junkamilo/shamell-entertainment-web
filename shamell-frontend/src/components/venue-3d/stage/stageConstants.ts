import { WORLD_DEPTH, WORLD_WIDTH } from "../venueSceneConstants";

export const STAGE_ZONE_ROTATION_Y = (12 * Math.PI) / 180;

const STAGE_ZONE_ROTATION_COS = Math.cos(STAGE_ZONE_ROTATION_Y);
const STAGE_ZONE_ROTATION_SIN = Math.sin(STAGE_ZONE_ROTATION_Y);

/** Uniform scale vs original stage mesh (width was 4.2). */
export const STAGE_SCALE = 1.3;

export const STAGE_WIDTH = 4.2 * STAGE_SCALE;
export const STAGE_DEPTH = 3.6 * STAGE_SCALE;

/** Stage zone X so the platform center aligns with the floor midline. */
function centeredStageZoneX(): number {
  const localCenterX = STAGE_WIDTH / 2;
  const localCenterZ = STAGE_DEPTH / 2;
  return (
    WORLD_WIDTH / 2 -
    localCenterX * STAGE_ZONE_ROTATION_COS -
    localCenterZ * STAGE_ZONE_ROTATION_SIN
  );
}

/** Local stage group: +Y up; front faces +Z (toward room center / carpet). */
export const STAGE_ZONE_POSITION: [number, number, number] = [
  centeredStageZoneX(),
  0,
  2.1,
];

/** Legacy anchor (local offset inside zone); prefer `stageLocalToWorld` for world coords. */
export const STAGE_POSITION: [number, number, number] = [0, 0, 0.7];
export const STAGE_HEIGHT = 0.45 * STAGE_SCALE;
export const STAGE_TOP_Y = STAGE_HEIGHT;

export const STAIR_COUNT = 3;
export const STAIR_DEPTH = 0.38 * STAGE_SCALE;
export const STAIR_WIDTH = 2.8 * STAGE_SCALE;

export const LIGHT_SPHERE_RADIUS = 0.048 * STAGE_SCALE;
export const LIGHT_SPACING = 0.25 * STAGE_SCALE;
export const LIGHT_EDGE_MARGIN = 0.18 * STAGE_SCALE;
export const LIGHT_Y_OFFSET = 0.035 * STAGE_SCALE;

export const STAGE_SKIRT_HEIGHT = 0.1 * STAGE_SCALE;
export const PLANK_COUNT = 5;
export const PLANK_GAP = 0.04 * STAGE_SCALE;

export const BACKDROP_HEIGHT = 2.6 * STAGE_SCALE;

export const ZONE_SPOT_INTENSITY = 0.72;
export const ZONE_STAIR_LIGHT_INTENSITY = 0.32;
export const ZONE_SPOT_HEIGHT_OFFSET = 3.2 * STAGE_SCALE;
export const ZONE_SPOT_FORWARD_OFFSET = 1.8 * STAGE_SCALE;
export const ZONE_STAIR_POINT_Y_OFFSET = 0.4 * STAGE_SCALE;
export const ZONE_STAIR_POINT_Z_OFFSET = 0.9 * STAGE_SCALE;
export const ZONE_SPOT_DISTANCE = 16 * STAGE_SCALE;

export function stageLocalToWorld(x: number, z: number): [number, number] {
  const wx =
    STAGE_ZONE_POSITION[0] + x * STAGE_ZONE_ROTATION_COS + z * STAGE_ZONE_ROTATION_SIN;
  const wz =
    STAGE_ZONE_POSITION[2] - x * STAGE_ZONE_ROTATION_SIN + z * STAGE_ZONE_ROTATION_COS;
  return [wx, wz];
}

/** World X center of stage platform (carpet alignment). */
export function getStageCenterX(): number {
  return stageLocalToWorld(STAGE_WIDTH / 2, STAGE_DEPTH / 2)[0];
}

/** World Z at the front base of stairs (carpet end). */
export function getStageStairsFrontZ(): number {
  return getStageStairsFrontWorld()[1];
}

/** Carpet runs from room entrance toward stage stairs. */
export const CARPET_START_Z = WORLD_DEPTH * 0.88;
export const CARPET_WIDTH = 3.1 * STAGE_SCALE;
export const CARPET_Y = 0.012;
export const CARPET_LENGTH = 12.5;

/** Front center of stairs in world space, used to anchor carpet. */
export function getStageStairsFrontWorld(): [number, number] {
  return stageLocalToWorld(STAGE_WIDTH / 2, STAGE_DEPTH + STAIR_COUNT * STAIR_DEPTH);
}
