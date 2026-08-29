/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_FLOOR_SCENE_ZONES } from "../../lib/floorSceneZonesDefaults";
import {
  FloorSceneZonesProvider,
  useFloorSceneZones,
} from "./FloorSceneZonesContext";

function ReadZone() {
  const zones = useFloorSceneZones();
  return <span>{String(zones.stage.x)}</span>;
}

describe("FloorSceneZonesContext", () => {
  it("provides default zones without a provider", () => {
    render(<ReadZone />);
    expect(
      screen.getByText(String(DEFAULT_FLOOR_SCENE_ZONES.stage.x)),
    ).toBeInTheDocument();
  });

  it("reads provided zones", () => {
    render(
      <FloorSceneZonesProvider
        zones={{
          stage: { x: 9, z: 1, rotationY: 0 },
          carpet: { x: 0, z: 0, rotationY: 0 },
        }}
      >
        <ReadZone />
      </FloorSceneZonesProvider>,
    );
    expect(screen.getByText("9")).toBeInTheDocument();
  });
});
