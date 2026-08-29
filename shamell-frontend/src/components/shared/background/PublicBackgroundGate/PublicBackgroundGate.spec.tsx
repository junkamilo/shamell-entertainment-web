/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const pathnameRef = vi.hoisted(() => ({ current: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

vi.mock("../AnimatedBackground", () => ({
  AnimatedBackground: () => <div data-testid="animated-background" />,
}));

import { PublicBackgroundGate } from "./PublicBackgroundGate";

describe("PublicBackgroundGate", () => {
  afterEach(() => {
    cleanup();
    pathnameRef.current = "/";
  });

  it("renders AnimatedBackground on public routes", () => {
    pathnameRef.current = "/";
    const { getByTestId } = render(<PublicBackgroundGate />);
    expect(getByTestId("animated-background")).toBeInTheDocument();
  });

  it("returns null on admin routes", () => {
    pathnameRef.current = "/admin/login";
    const { container } = render(<PublicBackgroundGate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null on shamell-admin routes", () => {
    pathnameRef.current = "/shamell-admin/gallery";
    const { container } = render(<PublicBackgroundGate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null on payment return routes", () => {
    pathnameRef.current = "/on-coming-events/return";
    const { container } = render(<PublicBackgroundGate />);
    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to / when pathname is null", () => {
    pathnameRef.current = null as unknown as string;
    const { getByTestId } = render(<PublicBackgroundGate />);
    expect(getByTestId("animated-background")).toBeInTheDocument();
  });
});
