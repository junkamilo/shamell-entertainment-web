/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const mediaState = vi.hoisted(() => ({
  mobile: false,
  reducedMotion: false,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => {
    if (query.includes("prefers-reduced-motion")) return mediaState.reducedMotion;
    if (query.includes("max-width")) return mediaState.mobile;
    return false;
  },
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

import { RevealFromDepth } from "./RevealFromDepth";

describe("RevealFromDepth", () => {
  beforeEach(() => {
    mediaState.mobile = false;
    mediaState.reducedMotion = false;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a plain div when reduced motion is preferred", () => {
    mediaState.reducedMotion = true;
    render(<RevealFromDepth className="depth">Static</RevealFromDepth>);
    expect(screen.getByText("Static")).toBeInTheDocument();
    expect(screen.queryByTestId("motion-div")).toBeNull();
  });

  it("uses mobile motion path", () => {
    mediaState.mobile = true;
    render(<RevealFromDepth delay={50} duration={900}>Mobile</RevealFromDepth>);
    expect(screen.getByTestId("motion-div")).toHaveTextContent("Mobile");
  });

  it("uses desktop blur motion path", () => {
    render(
      <RevealFromDepth style={{ marginTop: 8 }} duration={900}>
        Desktop
      </RevealFromDepth>,
    );
    expect(screen.getByTestId("motion-div")).toHaveTextContent("Desktop");
  });
});
