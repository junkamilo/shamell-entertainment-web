import { describe, expect, it } from "vitest";
import { layoutToWorld, worldToLayout } from "./layoutCoords3d";
import { WORLD_DEPTH, WORLD_WIDTH } from "./venueSceneConstants";

const VIEW_W = 1000;
const VIEW_H = 800;
const MARGIN = 12;

describe("layoutCoords3d", () => {
  it("maps layout origin and far corner into world footprint", () => {
    expect(layoutToWorld(0, 0, VIEW_W, VIEW_H)).toEqual({ x: 0, z: 0 });
    expect(layoutToWorld(VIEW_W, VIEW_H, VIEW_W, VIEW_H)).toEqual({
      x: WORLD_WIDTH,
      z: WORLD_DEPTH,
    });
  });

  it("maps layout midpoint to world midpoint", () => {
    expect(layoutToWorld(VIEW_W / 2, VIEW_H / 2, VIEW_W, VIEW_H)).toEqual({
      x: WORLD_WIDTH / 2,
      z: WORLD_DEPTH / 2,
    });
  });

  it("round-trips interior points within clamp margin", () => {
    const layout = { x: 200, y: 350 };
    const world = layoutToWorld(layout.x, layout.y, VIEW_W, VIEW_H);
    const back = worldToLayout(world.x, world.z, VIEW_W, VIEW_H);
    expect(back.x).toBeCloseTo(layout.x, 10);
    expect(back.y).toBeCloseTo(layout.y, 10);
  });

  it("clamps world→layout to margin inset", () => {
    expect(worldToLayout(-10, -10, VIEW_W, VIEW_H)).toEqual({
      x: MARGIN,
      y: MARGIN,
    });
    expect(worldToLayout(WORLD_WIDTH * 2, WORLD_DEPTH * 2, VIEW_W, VIEW_H)).toEqual({
      x: VIEW_W - MARGIN,
      y: VIEW_H - MARGIN,
    });
  });
});
