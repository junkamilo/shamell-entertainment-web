/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("../../scene/FloorSceneZonesContext", () => ({
  useFloorSceneZones: () => ({
    stage: { x: 12, z: 11, rotationY: 0 },
    carpet: { x: 12, z: 11, rotationY: 0 },
  }),
}));

import RedCarpetRunner from "./RedCarpetRunner";

describe("RedCarpetRunner", () => {
  it("smoke mounts without throwing", () => {
    expect(() => render(<RedCarpetRunner />)).not.toThrow();
  });

  it("mounts when stage zone is missing (fallback constants)", async () => {
    vi.resetModules();
    vi.doMock("../../scene/FloorSceneZonesContext", () => ({
      useFloorSceneZones: () => ({
        stage: undefined,
        carpet: undefined,
      }),
    }));
    const { default: Runner } = await import("./RedCarpetRunner");
    expect(() => render(<Runner />)).not.toThrow();
  });

  it("exports named and default from folder index", async () => {
    const mod = await import("./index");
    expect(typeof mod.default).toBe("function");
    expect(mod.RedCarpetRunner).toBe(mod.default);
  });
});
