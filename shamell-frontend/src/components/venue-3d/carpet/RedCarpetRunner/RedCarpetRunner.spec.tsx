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
    const { container } = render(<RedCarpetRunner />);
    expect(container.querySelector('[data-r3f="group"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-r3f="mesh"]').length).toBeGreaterThan(0);
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
    const { container } = render(<Runner />);
    expect(container.querySelector('[data-r3f="group"]')).toBeTruthy();
  });

  it("exports named and default from folder index", async () => {
    const mod = await import("./index");
    expect(typeof mod.default).toBe("function");
    expect(mod.RedCarpetRunner).toBe(mod.default);
  });
});
