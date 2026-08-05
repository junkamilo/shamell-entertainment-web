/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@react-three/drei", () => ({
  Html: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drei-html">{children}</div>
  ),
}));

import VenueHtmlLabelShell from "./VenueHtmlLabelShell";

describe("VenueHtmlLabelShell", () => {
  it("renders label with aria-label", () => {
    render(
      <VenueHtmlLabelShell label="T1" ariaLabel="Table 1" variant="number" />,
    );
    expect(screen.getByText("T1")).toBeInTheDocument();
    expect(screen.getByLabelText("Table 1")).toBeInTheDocument();
  });

  it("renders reserved variant text", () => {
    render(
      <VenueHtmlLabelShell
        label="Reserved"
        ariaLabel="Reserved"
        variant="reserved"
      />,
    );
    expect(screen.getByText("Reserved")).toBeInTheDocument();
  });
});
