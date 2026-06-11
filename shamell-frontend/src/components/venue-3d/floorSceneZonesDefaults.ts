import {
  carpetZoneFromStage,
  STAGE_ZONE_POSITION,
  STAGE_ZONE_ROTATION_Y,
} from "./stage/stageConstants";
import type { FloorSceneZones } from "@/components/floor-layout/layoutTypes";

const DEFAULT_STAGE = {
  x: STAGE_ZONE_POSITION[0],
  z: STAGE_ZONE_POSITION[2],
  rotationY: STAGE_ZONE_ROTATION_Y,
};

export const DEFAULT_FLOOR_SCENE_ZONES: FloorSceneZones = {
  stage: { ...DEFAULT_STAGE },
  carpet: carpetZoneFromStage(DEFAULT_STAGE),
};

export const SCENE_STAGE_SELECT_ID = "scene:stage";
export const SCENE_CARPET_SELECT_ID = "scene:carpet";

/** Only the stage is editable in admin; carpet stays fixed at the default anchor. */
export function isSceneSelectId(id: string | null): boolean {
  return id === SCENE_STAGE_SELECT_ID;
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
  const stage = parse(o.stage, DEFAULT_FLOOR_SCENE_ZONES.stage);
  return {
    stage,
    carpet: carpetZoneFromStage(stage),
  };
}
