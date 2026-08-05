/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src="/bailarina.png" />
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

vi.mock("@/components/shared", () => ({
  ShamellBackButton: ({
    label = "Back",
    href,
  }: {
    label?: string;
    href?: string;
  }) =>
    href ? (
      <a href={href} aria-label={label}>
        {label}
      </a>
    ) : (
      <button type="button" aria-label={label}>
        {label}
      </button>
    ),
}));

import { GalleryHero } from "./GalleryHero";

describe("GalleryHero", () => {
  it("renders gallery title and back link to home gallery section", () => {
    renderWithProviders(<GalleryHero />);
    expect(
      screen.getByRole("heading", { name: "GALLERY" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^back$/i })).toHaveAttribute(
      "href",
      "/#gallery",
    );
  });
});
