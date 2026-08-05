/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/threeR3fCompat", () => ({}));

vi.mock("@react-three/fiber", () => {
  const state = {
    invalidate: vi.fn(),
    camera: {},
    gl: { domElement: document.createElement("canvas") },
  };
  return {
    Canvas: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="r3f-canvas">{children}</div>
    ),
    useThree: (selector?: (s: typeof state) => unknown) =>
      typeof selector === "function" ? selector(state) : state,
    useFrame: () => {},
  };
});

vi.mock("@react-three/drei", () => ({
  Environment: () => null,
  OrbitControls: () => null,
}));

vi.mock("../../items/PlacedItemsLayer", () => ({
  default: () => <div data-testid="placed-items" />,
}));

vi.mock("../../room/VenueRoomPlaceholder", () => ({
  default: () => <div data-testid="room" />,
}));

vi.mock("../FloorPickPlane", () => ({
  default: () => null,
}));

import VenueScene3D from "./VenueScene3D";

describe("VenueScene3D", () => {
  it("mounts canvas shell for public-select", () => {
    render(
      <VenueScene3D
        mode="public-select"
        viewBoxWidth={1000}
        viewBoxHeight={800}
        items={[]}
      />,
    );
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
  });
});
