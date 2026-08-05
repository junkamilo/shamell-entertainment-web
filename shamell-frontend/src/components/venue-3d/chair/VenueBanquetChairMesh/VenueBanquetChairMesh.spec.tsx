/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  RoundedBox: () => null,
}));

vi.mock("../lib/chairSharedGeometries", () => ({
  getChairSharedGeometries: () => ({
    seat: {},
    back: {},
    leg: {},
    dispose: () => {},
  }),
}));

describe("VenueBanquetChairMesh smoke", () => {
  it("mounts without throwing", async () => {
    const mod = await import("./VenueBanquetChairMesh");
    const VenueBanquetChairMesh = mod.default;
    expect(() =>
      render(<VenueBanquetChairMesh selected reserved={false} />),
    ).not.toThrow();
  });
});
