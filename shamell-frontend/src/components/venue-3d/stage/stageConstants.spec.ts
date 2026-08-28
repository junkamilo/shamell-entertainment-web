import { describe, expect, it } from "vitest";
import {
  carpetZoneFromStage,
  getStageCenterX,
  getStageStairsFrontWorld,
  getStageStairsFrontZ,
  STAGE_ZONE_POSITION,
  STAGE_ZONE_ROTATION_Y,
  stageLocalToWorld,
  stageLocalToWorldAt,
} from "./stageConstants";

describe("stageConstants helpers", () => {
  it("maps local stage coords into world space", () => {
    const [x, z] = stageLocalToWorld(0, 0);
    expect(x).toBeCloseTo(STAGE_ZONE_POSITION[0], 10);
    expect(z).toBeCloseTo(STAGE_ZONE_POSITION[2], 10);
    expect(stageLocalToWorldAt({ x: 1, z: 2, rotationY: 0 }, 3, 4)).toEqual([4, 6]);
  });

  it("derives carpet and stair anchors from the default pose", () => {
    const zone = carpetZoneFromStage({
      x: STAGE_ZONE_POSITION[0],
      z: STAGE_ZONE_POSITION[2],
      rotationY: STAGE_ZONE_ROTATION_Y,
    });
    expect(getStageStairsFrontWorld()).toEqual([zone.x, zone.z]);
    expect(getStageStairsFrontZ()).toBe(zone.z);
    expect(typeof getStageCenterX()).toBe("number");
  });
});
