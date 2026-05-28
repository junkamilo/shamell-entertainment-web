import {
  getStageStairsFrontWorld,
  STAGE_ZONE_POSITION,
  STAGE_ZONE_ROTATION_Y,
} from "./stage/stageConstants";
import type { FloorSceneZones } from "@/components/floor-layout/layoutTypes";

const [carpetDefaultX, carpetDefaultZ] = getStageStairsFrontWorld();

export const DEFAULT_FLOOR_SCENE_ZONES: FloorSceneZones = {
  stage: {
    x: STAGE_ZONE_POSITION[0],
    z: STAGE_ZONE_POSITION[2],
    rotationY: STAGE_ZONE_ROTATION_Y,
  },
  carpet: {
    x: carpetDefaultX,
    z: carpetDefaultZ,
    rotationY: STAGE_ZONE_ROTATION_Y,
  },
};

export const SCENE_STAGE_SELECT_ID = "scene:stage";
export const SCENE_CARPET_SELECT_ID = "scene:carpet";

export function isSceneSelectId(id: string | null): boolean {
  return id === SCENE_STAGE_SELECT_ID || id === SCENE_CARPET_SELECT_ID;
}

export function mergeFloorSceneZones(raw: unknown): FloorSceneZones {
  if (!raw || typeof raw !== "object") {
    return {
      stage: { ...DEFAULT_FLOOR_SCENE_ZONES.stage },
      carpet: { ...DEFAULT_FLOOR_SCENE_ZONES.carpet },
    };
  }
  const o = raw as Record<string, unknown>;
  const parse = (
    part: unknown,
    fallback: FloorSceneZones["stage"],
  ): FloorSceneZones["stage"] => {
    if (!part || typeof part !== "object") return { ...fallback };
    const row = part as Record<string, unknown>;
    const x = Number(row.x);
    const z = Number(row.z);
    const rotationY = Number(row.rotationY);
    return {
      x: Number.isFinite(x) ? x : fallback.x,
      z: Number.isFinite(z) ? z : fallback.z,
      rotationY: Number.isFinite(rotationY) ? rotationY : fallback.rotationY,
    };
  };
  return {
    stage: parse(o.stage, DEFAULT_FLOOR_SCENE_ZONES.stage),
    carpet: parse(o.carpet, DEFAULT_FLOOR_SCENE_ZONES.carpet),
  };
}
