/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShamellBusyOverlay } from "./ShamellBusyOverlay";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

describe("ShamellBusyOverlay", () => {
  it("renders no dialog chrome when inactive", () => {
    render(<ShamellBusyOverlay active={false} title="Saving" />);
    expect(screen.queryByText("Saving")).not.toBeInTheDocument();
  });

  it("shows title in portal when active", () => {
    render(<ShamellBusyOverlay active title="Saving enrollment" />);
    expect(screen.getByText("Saving enrollment")).toBeInTheDocument();
  });

  it("applies custom overlayZClass on the root overlay", () => {
    const { container } = render(
      <ShamellBusyOverlay active title="Busy" overlayZClass="z-busy-test" />,
    );
    // Portal targets document.body; query outside container
    const overlay = document.body.querySelector(".z-busy-test");
    expect(overlay).toBeTruthy();
    expect(container).toBeTruthy();
  });
});
