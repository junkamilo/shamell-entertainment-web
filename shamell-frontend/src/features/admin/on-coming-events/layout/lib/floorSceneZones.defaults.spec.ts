import { describe, expect, it } from "vitest";
import {
  DEFAULT_FLOOR_SCENE_ZONES,
  SCENE_CARPET_SELECT_ID,
  SCENE_STAGE_SELECT_ID,
  isSceneSelectId,
  mergeFloorSceneZones,
} from "./floorSceneZones.defaults";

describe("floorSceneZones.defaults", () => {
  it("re-exports default scene zones", () => {
    expect(DEFAULT_FLOOR_SCENE_ZONES.stage).toMatchObject({ x: expect.any(Number), z: expect.any(Number) });
    expect(DEFAULT_FLOOR_SCENE_ZONES.carpet).toBeDefined();
  });

  it("identifies editable stage selection id", () => {
    expect(isSceneSelectId(SCENE_STAGE_SELECT_ID)).toBe(true);
    expect(isSceneSelectId(SCENE_CARPET_SELECT_ID)).toBe(false);
    expect(isSceneSelectId("item-1")).toBe(false);
  });

  it("merges partial scene zones with defaults", () => {
    const merged = mergeFloorSceneZones({
      stage: { x: 1, z: 2, rotationY: 0.5 },
    });
    expect(merged.stage.x).toBe(1);
    expect(merged.carpet).toBeDefined();
  });
});
