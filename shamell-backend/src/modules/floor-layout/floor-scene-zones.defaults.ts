/** Defaults aligned with shamell-frontend venue-3d/stage/stageConstants.ts */

const WORLD_WIDTH = 24;
const WORLD_DEPTH = 22;
const STAGE_ZONE_ROTATION_Y = (12 * Math.PI) / 180;
const STAGE_SCALE = 1.3;
const STAGE_WIDTH = 4.2 * STAGE_SCALE;
const STAGE_DEPTH = 3.6 * STAGE_SCALE;
const STAIR_COUNT = 3;
const STAIR_DEPTH = 0.38 * STAGE_SCALE;

const STAGE_ZONE_ROTATION_COS = Math.cos(STAGE_ZONE_ROTATION_Y);
const STAGE_ZONE_ROTATION_SIN = Math.sin(STAGE_ZONE_ROTATION_Y);

function centeredStageZoneX(): number {
  const localCenterX = STAGE_WIDTH / 2;
  const localCenterZ = STAGE_DEPTH / 2;
  return (
    WORLD_WIDTH / 2 -
    localCenterX * STAGE_ZONE_ROTATION_COS -
    localCenterZ * STAGE_ZONE_ROTATION_SIN
  );
}

const DEFAULT_STAGE_X = centeredStageZoneX();
const DEFAULT_STAGE_Z = 2.1;

function stageLocalToWorld(x: number, z: number): [number, number] {
  const wx =
    DEFAULT_STAGE_X + x * STAGE_ZONE_ROTATION_COS + z * STAGE_ZONE_ROTATION_SIN;
  const wz =
    DEFAULT_STAGE_Z - x * STAGE_ZONE_ROTATION_SIN + z * STAGE_ZONE_ROTATION_COS;
  return [wx, wz];
}

function defaultCarpetPosition(): { x: number; z: number } {
  const [x, z] = stageLocalToWorld(
    STAGE_WIDTH / 2,
    STAGE_DEPTH + STAIR_COUNT * STAIR_DEPTH,
  );
  return { x, z };
}

export type FloorSceneZoneTransform = {
  x: number;
  z: number;
  rotationY: number;
};

export type FloorSceneZones = {
  stage: FloorSceneZoneTransform;
  carpet: FloorSceneZoneTransform;
};

export const DEFAULT_FLOOR_SCENE_ZONES: FloorSceneZones = {
  stage: {
    x: DEFAULT_STAGE_X,
    z: DEFAULT_STAGE_Z,
    rotationY: STAGE_ZONE_ROTATION_Y,
  },
  carpet: {
    ...defaultCarpetPosition(),
    rotationY: STAGE_ZONE_ROTATION_Y,
  },
};

function clampWorld(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
}

function parseZonePartial(
  raw: unknown,
  fallback: FloorSceneZoneTransform,
): FloorSceneZoneTransform {
  if (!raw || typeof raw !== 'object') return { ...fallback };
  const o = raw as Record<string, unknown>;
  const x = Number(o.x);
  const z = Number(o.z);
  const rotationY = Number(o.rotationY);
  return {
    x: Number.isFinite(x) ? clampWorld(x, WORLD_WIDTH) : fallback.x,
    z: Number.isFinite(z) ? clampWorld(z, WORLD_DEPTH) : fallback.z,
    rotationY: Number.isFinite(rotationY) ? rotationY : fallback.rotationY,
  };
}

export function mergeFloorSceneZones(raw: unknown): FloorSceneZones {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_FLOOR_SCENE_ZONES };
  }
  const o = raw as Record<string, unknown>;
  return {
    stage: parseZonePartial(o.stage, DEFAULT_FLOOR_SCENE_ZONES.stage),
    carpet: parseZonePartial(o.carpet, DEFAULT_FLOOR_SCENE_ZONES.carpet),
  };
}

export function normalizeFloorSceneZonesInput(
  input: FloorSceneZones | undefined,
): FloorSceneZones {
  if (!input) return mergeFloorSceneZones(null);
  return mergeFloorSceneZones(input);
}
