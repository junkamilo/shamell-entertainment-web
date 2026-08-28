/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { Suspense } from "react";

const textureMode = vi.hoisted(() => ({ throwSuspense: false }));

vi.mock("@react-three/drei", () => ({
  useTexture: () => {
    if (textureMode.throwSuspense) {
      throw new Promise(() => undefined);
    }
    return {
      clone: () => ({
        wrapS: 0,
        wrapT: 0,
        repeat: { set: () => undefined },
        anisotropy: 1,
        needsUpdate: false,
      }),
    };
  },
}));

import VenueWoodFloor from "./VenueWoodFloor";

describe("VenueWoodFloor", () => {
  it("mounts the textured floor", () => {
    const { container } = render(<VenueWoodFloor />);
    expect(container.querySelector('[data-r3f="mesh"]')).toBeTruthy();
  });

  it("shows the color fallback while the texture is pending", () => {
    textureMode.throwSuspense = true;
    render(
      <Suspense fallback={null}>
        <VenueWoodFloor />
      </Suspense>,
    );
    expect(document.querySelector('[data-r3f="mesh"]')).toBeTruthy();
    textureMode.throwSuspense = false;
  });
});
