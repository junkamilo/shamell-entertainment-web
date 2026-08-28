/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Matrix4 } from "three";

vi.mock("@react-three/fiber", () => {
  const state = { invalidate: vi.fn() };
  return {
    useThree: (selector?: (s: typeof state) => unknown) =>
      typeof selector === "function" ? selector(state) : state,
  };
});

vi.mock("../lib/chairSharedGeometries", () => ({
  getChairSharedGeometries: () => ({
    leg: {},
    seat: {},
    back: {},
    backCap: {},
  }),
}));

import InstancedBanquetChairs from "./InstancedBanquetChairs";

const matrix = () => new Matrix4().identity();

describe("InstancedBanquetChairs", () => {
  it("smoke mounts with empty placements", () => {
    expect(() =>
      render(
        <InstancedBanquetChairs
          placements={[]}
          perfProfile="mobile"
          castShadow={false}
        />,
      ),
    ).not.toThrow();
  });

  it("instances available, selected, and reserved chairs", () => {
    expect(() =>
      render(
        <InstancedBanquetChairs
          placements={[
            { state: "available", matrix: matrix() },
            { state: "selected", matrix: matrix() },
            { state: "reserved", matrix: matrix() },
          ]}
        />,
      ),
    ).not.toThrow();
    expect(document.querySelectorAll('[data-r3f="instancedMesh"]').length).toBeGreaterThan(
      0,
    );
  });

  it("exports named and default from folder index", async () => {
    const mod = await import("./index");
    expect(typeof mod.default).toBe("function");
    expect(mod.InstancedBanquetChairs).toBe(mod.default);
  });
});
