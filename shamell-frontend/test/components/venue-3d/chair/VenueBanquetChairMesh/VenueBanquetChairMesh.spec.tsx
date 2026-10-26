/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  RoundedBox: () => null,
}));

vi.mock("@/components/venue-3d/chair/lib/chairSharedGeometries", () => ({
  getChairSharedGeometries: () => ({
    seat: {},
    back: {},
    leg: {},
    dispose: () => {},
  }),
}));

describe("VenueBanquetChairMesh smoke", () => {
  it("mounts without throwing", async () => {
    const mod = await import("@/components/venue-3d/chair/VenueBanquetChairMesh/VenueBanquetChairMesh");
    const VenueBanquetChairMesh = mod.default;
    expect(() =>
      render(<VenueBanquetChairMesh selected reserved={false} />),
    ).not.toThrow();
  });

  it("uses the mobile seat mesh", async () => {
    const { default: VenueBanquetChairMesh } = await import("@/components/venue-3d/chair/VenueBanquetChairMesh/VenueBanquetChairMesh");
    const { container } = render(
      <VenueBanquetChairMesh reserved perfProfile="mobile" rotationY={0.2} />,
    );
    expect(container.querySelectorAll('[data-r3f="mesh"]').length).toBeGreaterThan(0);
  });
});
