import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { WORLD_DEPTH, WORLD_WIDTH, worldToLayout } from "@/components/venue-3d";
import { pickFloorFromClient, pickWorldFromClient } from "./floorLayoutRaycast";

const VIEW_W = 614;
const VIEW_H = 944;

function makeCanvas() {
  return {
    getBoundingClientRect: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    }),
  } as HTMLCanvasElement;
}

function lookingDownOrtho(worldX: number, worldZ: number) {
  const cam = new THREE.OrthographicCamera(-12, 12, 11, -11, 0.1, 100);
  cam.position.set(worldX, 10, worldZ);
  cam.rotation.x = -Math.PI / 2;
  cam.updateMatrixWorld();
  return cam;
}

function lookingUpCamera() {
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  cam.position.set(0, 1, 0);
  cam.lookAt(0, 10, 0);
  cam.updateMatrixWorld();
  return cam;
}

describe("floorLayoutRaycast", () => {
  it("picks world and layout at the canvas center", () => {
    const canvas = makeCanvas();
    const cam = lookingDownOrtho(WORLD_WIDTH / 2, WORLD_DEPTH / 2);

    const world = pickWorldFromClient(50, 50, canvas, cam);
    expect(world).not.toBeNull();
    expect(world!.x).toBeCloseTo(WORLD_WIDTH / 2, 3);
    expect(world!.z).toBeCloseTo(WORLD_DEPTH / 2, 3);

    const layout = pickFloorFromClient(50, 50, canvas, cam, VIEW_W, VIEW_H);
    expect(layout).toEqual(
      worldToLayout(world!.x, world!.z, VIEW_W, VIEW_H),
    );
  });

  it("returns null when the ray misses the floor plane", () => {
    const canvas = makeCanvas();
    const cam = lookingUpCamera();
    expect(pickWorldFromClient(50, 50, canvas, cam)).toBeNull();
    expect(pickFloorFromClient(50, 50, canvas, cam, VIEW_W, VIEW_H)).toBeNull();
  });

  it("clamps world X/Z to the floor bounds", () => {
    const canvas = makeCanvas();

    const left = pickWorldFromClient(
      50,
      50,
      canvas,
      lookingDownOrtho(-8, WORLD_DEPTH / 2),
    );
    expect(left!.x).toBe(0);
    expect(left!.z).toBeCloseTo(WORLD_DEPTH / 2, 3);

    const right = pickWorldFromClient(
      50,
      50,
      canvas,
      lookingDownOrtho(WORLD_WIDTH + 8, WORLD_DEPTH / 2),
    );
    expect(right!.x).toBe(WORLD_WIDTH);

    const near = pickWorldFromClient(
      50,
      50,
      canvas,
      lookingDownOrtho(WORLD_WIDTH / 2, -8),
    );
    expect(near!.z).toBe(0);

    const far = pickWorldFromClient(
      50,
      50,
      canvas,
      lookingDownOrtho(WORLD_WIDTH / 2, WORLD_DEPTH + 8),
    );
    expect(far!.z).toBe(WORLD_DEPTH);

    const floor = pickFloorFromClient(
      50,
      50,
      canvas,
      lookingDownOrtho(-8, WORLD_DEPTH / 2),
      VIEW_W,
      VIEW_H,
    );
    const expected = worldToLayout(0, WORLD_DEPTH / 2, VIEW_W, VIEW_H);
    expect(floor!.x).toBeCloseTo(expected.x, 5);
    expect(floor!.y).toBeCloseTo(expected.y, 5);
  });
});
