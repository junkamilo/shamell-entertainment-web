/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/shared/RevealFromDepth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ConciergeGate from "./ConciergeGate";

describe("ConciergeGate", () => {
  it("shows heading and booking/concierge links", () => {
    renderWithProviders(<ConciergeGate />);
    expect(
      screen.getByRole("heading", { name: /how clear is your vision/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start booking inquiry/i }),
    ).toHaveAttribute("href", "/contacto?mode=booking");
    expect(
      screen.getByRole("link", { name: /start concierge inquiry/i }),
    ).toHaveAttribute("href", "/contacto?mode=concierge");
  });
});
