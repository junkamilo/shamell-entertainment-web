/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import GalleryCategoriesGoToGalleryLink from "./GalleryCategoriesGoToGalleryLink";

describe("GalleryCategoriesGoToGalleryLink", () => {
  it("links Go to gallery to /admin/gallery", () => {
    renderWithProviders(<GalleryCategoriesGoToGalleryLink />);

    expect(screen.getByRole("link", { name: /Go to gallery/i })).toHaveAttribute(
      "href",
      "/admin/gallery",
    );
  });
});
