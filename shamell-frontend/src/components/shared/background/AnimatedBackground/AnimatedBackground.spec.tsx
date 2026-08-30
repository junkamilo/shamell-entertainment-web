/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { AnimatedBackground } from "./AnimatedBackground";

describe("AnimatedBackground", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders lite wash and orb stage (CSS hides orbs on mobile)", () => {
    const { container, getByTestId } = render(<AnimatedBackground />);
    const stage = getByTestId("animated-background");
    expect(stage.getAttribute("data-force-motion")).toBeNull();
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(2);
    expect(container.querySelectorAll("span").length).toBe(8);
  });

  it("sets data-force-motion when requested", () => {
    const { getByTestId } = render(<AnimatedBackground forceAnimation />);
    expect(getByTestId("animated-background").getAttribute("data-force-motion")).toBe(
      "true",
    );
  });
});
