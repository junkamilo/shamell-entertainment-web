/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

const mediaState = vi.hoisted(() => ({
  mobile: false,
  reducedMotion: false,
}));

const inViewState = vi.hoisted(() => ({ current: true }));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: (query: string) => {
    if (query.includes("prefers-reduced-motion")) return mediaState.reducedMotion;
    if (query.includes("max-width")) return mediaState.mobile;
    return false;
  },
}));

vi.mock("motion/react", () => ({
  useInView: () => inViewState.current,
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

import { RevealStaggerGrid } from "./RevealStaggerGrid";

describe("RevealStaggerGrid", () => {
  beforeEach(() => {
    mediaState.mobile = false;
    mediaState.reducedMotion = false;
    inViewState.current = true;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders children plain when reduced motion is preferred", () => {
    mediaState.reducedMotion = true;
    render(
      <RevealStaggerGrid>
        <span>A</span>
        <span>B</span>
      </RevealStaggerGrid>,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("wraps valid children with item classNames on desktop", () => {
    render(
      <RevealStaggerGrid itemClassNames={["cell-a", "cell-b"]}>
        <div>One</div>
        <div>Two</div>
        {"plain-text"}
      </RevealStaggerGrid>,
    );
    expect(screen.getByText("One").parentElement?.className).toContain("cell-a");
    expect(screen.getByText("Two").parentElement?.className).toContain("cell-b");
    expect(screen.getByText("plain-text")).toBeInTheDocument();
  });

  it("uses mobile item variants", () => {
    mediaState.mobile = true;
    inViewState.current = false;
    render(
      <RevealStaggerGrid itemDuration={600}>
        <div>Mobile item</div>
      </RevealStaggerGrid>,
    );
    expect(screen.getByText("Mobile item")).toBeInTheDocument();
  });

  it("bumps key on bfcache pageshow", () => {
    render(
      <RevealStaggerGrid>
        <div>Cached</div>
      </RevealStaggerGrid>,
    );
    act(() => {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: true });
      window.dispatchEvent(event);
    });
    expect(screen.getByText("Cached")).toBeInTheDocument();
  });

  it("ignores non-persisted pageshow events", () => {
    render(
      <RevealStaggerGrid>
        <div>Live</div>
      </RevealStaggerGrid>,
    );
    act(() => {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: false });
      window.dispatchEvent(event);
    });
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
