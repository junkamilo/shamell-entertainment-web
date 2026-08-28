/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({
    alt,
    ...rest
  }: {
    alt?: string;
  } & React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt ?? ""} {...rest} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/shared/ornament", () => ({
  PearlDivider: ({ className }: { className?: string }) => (
    <div data-testid="pearl-divider" className={className} />
  ),
}));

import Footer from "./Footer";

describe("Footer", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders explore links, Inquire CTA, and copyright year", () => {
    render(<Footer />);
    expect(screen.getByRole("navigation", { name: "Footer links" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/#hero",
    );
    expect(screen.getByRole("link", { name: "Inquire" })).toHaveAttribute(
      "href",
      "/contacto",
    );
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} Shamell`)),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pearl-divider")).toBeNull();
  });

  it("shows top pearls and full-width layout", () => {
    const { container } = render(
      <Footer fullWidth topPearls className="extra-footer" />,
    );
    expect(screen.getByTestId("pearl-divider")).toBeInTheDocument();
    expect(container.querySelector("footer")?.className).toContain("extra-footer");
    expect(container.querySelector(".w-full.px-0")).toBeTruthy();
  });

  it("exposes Instagram and email contact affordances", () => {
    render(<Footer />);
    expect(
      screen.getByRole("link", { name: /Instagram/i }),
    ).toHaveAttribute("href", "https://instagram.com/Shamellentertainment");
    expect(
      screen.getByRole("link", { name: /Send inquiry by email/i }),
    ).toHaveAttribute("href", "/contacto");
  });
});
