/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  useTexture: () => ({
    clone: () => ({
      wrapS: 0,
      wrapT: 0,
      repeat: { set: () => {} },
      needsUpdate: false,
    }),
  }),
}));

vi.mock("../scene/FloorSceneZonesContext", () => ({
  useFloorSceneZones: () => ({
    stage: { x: 12, z: 11, rotationY: 0 },
    carpet: { x: 12, z: 11, rotationY: 0 },
  }),
}));

describe("room smoke", () => {
  it("VenueWoodFloor mounts", async () => {
    const { default: VenueWoodFloor } = await import(
      "./VenueWoodFloor/VenueWoodFloor"
    );
    expect(() => render(<VenueWoodFloor />)).not.toThrow();
  });

  it("VenueWallSconces mounts", async () => {
    const { default: VenueWallSconces } = await import(
      "./VenueWallSconces/VenueWallSconces"
    );
    expect(() => render(<VenueWallSconces />)).not.toThrow();
  });

  it("VenueWallSconces mounts mobile without lights", async () => {
    const { default: VenueWallSconces } = await import(
      "./VenueWallSconces/VenueWallSconces"
    );
    expect(() => render(<VenueWallSconces perfProfile="mobile" />)).not.toThrow();
  });
});
