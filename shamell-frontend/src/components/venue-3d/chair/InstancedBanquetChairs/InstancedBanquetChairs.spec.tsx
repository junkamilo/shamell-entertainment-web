/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

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

  it("exports named and default from folder index", async () => {
    const mod = await import("./index");
    expect(typeof mod.default).toBe("function");
    expect(mod.InstancedBanquetChairs).toBe(mod.default);
  });
});
