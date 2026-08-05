/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drei-html">{children}</div>
  ),
}));

import VenueItemNumberBubble from "./VenueItemNumberBubble";

describe("VenueItemNumberBubble", () => {
  it("renders short label via shell", () => {
    render(
      <VenueItemNumberBubble shortLabel="C3" fullLabel="Chair 3" />,
    );
    expect(screen.getByText("C3")).toBeInTheDocument();
    expect(screen.getByLabelText("Chair 3")).toBeInTheDocument();
  });
});
