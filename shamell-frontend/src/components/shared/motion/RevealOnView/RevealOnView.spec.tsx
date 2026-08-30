/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

const mediaState = vi.hoisted(() => ({
  mobile: false,
  reducedMotion: false,
}));

const inViewState = vi.hoisted(() => ({ current: false }));
const mountedState = vi.hoisted(() => ({ value: true }));

vi.mock("@/hooks/use-has-mounted", () => ({
  useHasMounted: () => mountedState.value,
}));

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

import { RevealOnView } from "./RevealOnView";

describe("RevealOnView", () => {
  beforeEach(() => {
    mediaState.mobile = false;
    mediaState.reducedMotion = false;
    inViewState.current = false;
    mountedState.value = true;
  });

  afterEach(() => {
    cleanup();
  });

  it("renders a static div before mount (SSR hydration safe)", () => {
    mountedState.value = false;
    mediaState.reducedMotion = true;
    render(<RevealOnView>SSR</RevealOnView>);
    expect(screen.getByText("SSR")).toBeInTheDocument();
    expect(screen.queryByTestId("motion-div")).toBeNull();
  });

  it("renders a plain div when reduced motion is preferred", () => {
    mediaState.reducedMotion = true;
    render(
      <RevealOnView className="reveal" style={{ color: "red" }}>
        Content
      </RevealOnView>,
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.queryByTestId("motion-div")).toBeNull();
  });

  it("renders motion wrapper on desktop", () => {
    inViewState.current = true;
    render(<RevealOnView delay={100}>Desktop</RevealOnView>);
    expect(screen.getByTestId("motion-div")).toHaveTextContent("Desktop");
  });

  it("uses lite variants on mobile", () => {
    mediaState.mobile = true;
    render(<RevealOnView duration={600}>Mobile</RevealOnView>);
    expect(screen.getByTestId("motion-div")).toHaveTextContent("Mobile");
  });

  it("remounts on bfcache pageshow", () => {
    render(<RevealOnView>Cache</RevealOnView>);
    expect(screen.getByTestId("motion-div")).toBeInTheDocument();
    act(() => {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: true });
      window.dispatchEvent(event);
    });
    expect(screen.getByText("Cache")).toBeInTheDocument();
  });

  it("ignores non-persisted pageshow events", () => {
    render(<RevealOnView>Live</RevealOnView>);
    act(() => {
      const event = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(event, "persisted", { value: false });
      window.dispatchEvent(event);
    });
    expect(screen.getByText("Live")).toBeInTheDocument();
  });
});
