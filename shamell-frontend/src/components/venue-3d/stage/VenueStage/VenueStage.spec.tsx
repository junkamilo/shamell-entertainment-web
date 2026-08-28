/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const zones = vi.hoisted(() => ({
  stage: { x: 12, z: 11, rotationY: 0 } as
    | { x: number; z: number; rotationY: number }
    | undefined,
}));

vi.mock("../../scene/FloorSceneZonesContext", () => ({
  useFloorSceneZones: () => ({
    stage: zones.stage,
    carpet: { x: 12, z: 11, rotationY: 0 },
  }),
}));

vi.mock("../StageBackdrop", () => ({ default: () => null, StageBackdrop: () => null }));
vi.mock("../StagePlatform", () => ({ default: () => null, StagePlatform: () => null }));
vi.mock("../StagePerimeterLights", () => ({
  default: () => null,
  StagePerimeterLights: () => null,
}));
vi.mock("../StageStairs", () => ({ default: () => null, StageStairs: () => null }));
vi.mock("../StageZoneLights", () => ({ default: () => null, StageZoneLights: () => null }));
vi.mock("../StageCornerPlants", () => ({
  default: () => <div data-testid="corner-plants" />,
  StageCornerPlants: () => <div data-testid="corner-plants" />,
}));

import VenueStage from "./VenueStage";

describe("VenueStage", () => {
  it("mounts corner plants in stage composition", () => {
    zones.stage = { x: 12, z: 11, rotationY: 0 };
    render(<VenueStage />);
    expect(screen.getByTestId("corner-plants")).toBeInTheDocument();
  });

  it("falls back to default stage pose", () => {
    zones.stage = undefined;
    expect(() => render(<VenueStage />)).not.toThrow();
  });
});
