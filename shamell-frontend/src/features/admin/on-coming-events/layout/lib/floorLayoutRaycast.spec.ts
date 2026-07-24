import { describe, expect, it } from "vitest";
import { pickFloorFromClient, pickWorldFromClient } from "./floorLayoutRaycast";

describe("floorLayoutRaycast", () => {
  it("exports pickFloorFromClient as a function", () => {
    expect(typeof pickFloorFromClient).toBe("function");
  });

  it("exports pickWorldFromClient as a function", () => {
    expect(typeof pickWorldFromClient).toBe("function");
  });
});
