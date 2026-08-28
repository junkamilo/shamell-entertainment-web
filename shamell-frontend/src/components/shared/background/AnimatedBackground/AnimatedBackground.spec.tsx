/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AnimatedBackground } from "./AnimatedBackground";

describe("AnimatedBackground", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders orb stage with particles", () => {
    const { container } = render(<AnimatedBackground />);
    const stage = container.firstElementChild;
    expect(stage?.getAttribute("data-force-motion")).toBe("false");
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(1);
  });

  it("sets data-force-motion when requested", () => {
    const { container } = render(<AnimatedBackground forceAnimation />);
    expect(container.firstElementChild?.getAttribute("data-force-motion")).toBe(
      "true",
    );
  });
});
