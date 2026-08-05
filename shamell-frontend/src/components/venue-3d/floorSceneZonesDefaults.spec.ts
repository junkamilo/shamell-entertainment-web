import { describe, expect, it } from "vitest";
import {
  DEFAULT_FLOOR_SCENE_ZONES,
  isSceneSelectId,
  mergeFloorSceneZones,
  SCENE_CARPET_SELECT_ID,
  SCENE_STAGE_SELECT_ID,
} from "./floorSceneZonesDefaults";
import { carpetZoneFromStage } from "./stage/stageConstants";

describe("floorSceneZonesDefaults", () => {
  it("returns defaults for null/invalid input", () => {
    expect(mergeFloorSceneZones(null)).toEqual(DEFAULT_FLOOR_SCENE_ZONES);
    expect(mergeFloorSceneZones(undefined)).toEqual(DEFAULT_FLOOR_SCENE_ZONES);
    expect(mergeFloorSceneZones("bad")).toEqual(DEFAULT_FLOOR_SCENE_ZONES);
  });

  it("merges stage and derives carpet from stage", () => {
    const stage = { x: 10, z: 12, rotationY: 0.5 };
    const merged = mergeFloorSceneZones({ stage, carpet: { x: 0, z: 0, rotationY: 0 } });
    expect(merged.stage).toEqual(stage);
    expect(merged.carpet).toEqual(carpetZoneFromStage(stage));
  });

  it("falls back per-field when stage numbers are invalid", () => {
    const merged = mergeFloorSceneZones({
      stage: { x: "nope", z: 5, rotationY: Number.NaN },
    });
    expect(merged.stage.x).toBe(DEFAULT_FLOOR_SCENE_ZONES.stage.x);
    expect(merged.stage.z).toBe(5);
    expect(merged.stage.rotationY).toBe(DEFAULT_FLOOR_SCENE_ZONES.stage.rotationY);
  });

  it("recognizes only stage scene select id as editable", () => {
    expect(isSceneSelectId(SCENE_STAGE_SELECT_ID)).toBe(true);
    expect(isSceneSelectId(SCENE_CARPET_SELECT_ID)).toBe(false);
    expect(isSceneSelectId(null)).toBe(false);
    expect(isSceneSelectId("table-1")).toBe(false);
  });
});
