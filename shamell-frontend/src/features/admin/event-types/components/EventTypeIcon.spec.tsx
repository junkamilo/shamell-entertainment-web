/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventTypeIcon from "./EventTypeIcon";

describe("EventTypeIcon", () => {
  it("renders an svg icon for a name", () => {
    const { container } = renderWithProviders(
      <EventTypeIcon name="Private weddings" />,
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies the given className", () => {
    const { container } = renderWithProviders(
      <EventTypeIcon name="Corporate gala" className="h-4 w-4 text-gold/90" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toHaveClass("h-4", "w-4", "text-gold/90");
  });

  it("renders different icons for different names", () => {
    const a = renderWithProviders(<EventTypeIcon name="AAAA" />);
    const b = renderWithProviders(<EventTypeIcon name="ZZZZ" />);
    expect(a.container.querySelector("svg")).toBeInTheDocument();
    expect(b.container.querySelector("svg")).toBeInTheDocument();
  });
});
