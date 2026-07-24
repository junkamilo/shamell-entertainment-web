/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServiceTypeIcon from "./ServiceTypeIcon";

describe("ServiceTypeIcon", () => {
  it("renders an svg icon for a name", () => {
    const { container } = renderWithProviders(
      <ServiceTypeIcon name="Performance" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies the given className", () => {
    const { container } = renderWithProviders(
      <ServiceTypeIcon name="Private class" className="h-4 w-4 text-gold/90" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-4", "w-4", "text-gold/90");
  });

  it("renders different icons for different names", () => {
    const a = renderWithProviders(<ServiceTypeIcon name="AAAA" />);
    const b = renderWithProviders(<ServiceTypeIcon name="ZZZZ" />);
    expect(a.container.querySelector("svg")).toBeInTheDocument();
    expect(b.container.querySelector("svg")).toBeInTheDocument();
  });
});
