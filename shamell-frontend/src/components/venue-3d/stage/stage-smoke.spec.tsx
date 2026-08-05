/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => {},
  useThree: (selector?: (s: { invalidate: () => void }) => unknown) => {
    const state = { invalidate: vi.fn() };
    return typeof selector === "function" ? selector(state) : state;
  },
}));

vi.mock("@react-three/drei", () => ({
  useTexture: () => ({
    clone: () => ({
      colorSpace: "",
      needsUpdate: false,
      anisotropy: 1,
    }),
  }),
}));

vi.mock("../scene/FloorSceneZonesContext", () => ({
  useFloorSceneZones: () => ({
    stage: { x: 12, z: 11, rotationY: 0 },
    carpet: { x: 12, z: 11, rotationY: 0 },
  }),
}));

describe("stage piece smoke", () => {
  it("StagePlatform mounts", async () => {
    const { default: StagePlatform } = await import("./StagePlatform/StagePlatform");
    expect(() => render(<StagePlatform />)).not.toThrow();
  });

  it("StageStairs mounts", async () => {
    const { default: StageStairs } = await import("./StageStairs/StageStairs");
    expect(() => render(<StageStairs />)).not.toThrow();
  });

  it("StageBackdrop mounts", async () => {
    const { default: StageBackdrop } = await import("./StageBackdrop/StageBackdrop");
    expect(() => render(<StageBackdrop />)).not.toThrow();
  });

  it("StagePalmPlant mounts", async () => {
    const { default: StagePalmPlant } = await import("./StagePalmPlant/StagePalmPlant");
    expect(() =>
      render(<StagePalmPlant position={[0, 0, 0]} scale={1} />),
    ).not.toThrow();
  });

  it("StageCornerPlants mounts", async () => {
    const { default: StageCornerPlants } = await import(
      "./StageCornerPlants/StageCornerPlants"
    );
    expect(() => render(<StageCornerPlants />)).not.toThrow();
  });

  it("StagePerimeterLights module exports component", async () => {
    const { default: StagePerimeterLights } = await import(
      "./StagePerimeterLights/StagePerimeterLights"
    );
    expect(typeof StagePerimeterLights).toBe("function");
  });

  it("StageZoneLights mounts", async () => {
    const { default: StageZoneLights } = await import(
      "./StageZoneLights/StageZoneLights"
    );
    expect(() => render(<StageZoneLights />)).not.toThrow();
  });
});
