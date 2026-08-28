/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import PearlDivider from "./PearlDivider";

describe("PearlDivider", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders inline strand by default", () => {
    const { container } = render(<PearlDivider />);
    const svg = container.querySelector("svg[role='presentation']");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("class") ?? "").toContain("max-w-4xl");
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(10);
  });

  it("stretches inline strand when fullWidth", () => {
    const { container } = render(<PearlDivider fullWidth />);
    expect(container.querySelector("svg")?.getAttribute("class") ?? "").toContain(
      "max-w-none",
    );
  });

  it("renders hero bottom-edge strand", () => {
    const { container } = render(
      <PearlDivider variant="hero" className="hero-pearls" />,
    );
    const root = container.firstElementChild as HTMLElement | null;
    expect(root?.getAttribute("aria-hidden")).toBe("true");
    expect(root?.className).toContain("hero-pearls");
    expect(root?.className).toContain("absolute");
    expect(container.querySelector("path")).toBeTruthy();
  });
});
