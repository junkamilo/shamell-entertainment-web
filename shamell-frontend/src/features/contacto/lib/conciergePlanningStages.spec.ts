import { describe, expect, it } from "vitest";
import {
  CONCIERGE_PLANNING_STAGES,
  isConciergePlanningStage,
} from "./conciergePlanningStages";

describe("isConciergePlanningStage", () => {
  it("accepts the four concierge stages", () => {
    for (const stage of CONCIERGE_PLANNING_STAGES) {
      expect(isConciergePlanningStage(stage)).toBe(true);
    }
  });

  it("rejects empty or unknown values", () => {
    expect(isConciergePlanningStage("")).toBe(false);
    expect(isConciergePlanningStage("Exploring options")).toBe(false);
  });
});
