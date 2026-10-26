/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => {},
}));

import FloorPickPlane from "@/components/venue-3d/scene/FloorPickPlane/FloorPickPlane";

describe("FloorPickPlane", () => {
  it("smoke mounts with onPointerMissed", () => {
    const onPointerMissed = vi.fn();
    expect(() =>
      render(<FloorPickPlane onPointerMissed={onPointerMissed} />),
    ).not.toThrow();
  });
});
