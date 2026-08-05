import { describe, expect, it } from "vitest";
import { TABLE_WORLD } from "../../venueSceneConstants";
import { CHAIR_SEAT } from "./chairConstants";
import {
  buildTableChairPlacements,
  CHAIR_TABLE_EDGE_GAP,
} from "./catalogTableChairPlacements";

describe("buildTableChairPlacements", () => {
  it("returns one placement per included chair", () => {
    expect(buildTableChairPlacements("LARGE", 8)).toHaveLength(8);
    expect(buildTableChairPlacements("MEDIUM", 1)).toHaveLength(1);
  });

  it("places chairs at table radius plus seat depth and gap", () => {
    const size = "SMALL" as const;
    const expectedR =
      TABLE_WORLD[size].tableRadius + CHAIR_SEAT.depth * 0.5 + CHAIR_TABLE_EDGE_GAP;
    const placements = buildTableChairPlacements(size, 4);
    for (const p of placements) {
      const dist = Math.hypot(p.position[0], p.position[2]);
      expect(dist).toBeCloseTo(expectedR, 10);
    }
  });
});
