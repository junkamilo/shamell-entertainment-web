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

import GalleryNoCategoriesBanner from "./GalleryNoCategoriesBanner";

describe("GalleryNoCategoriesBanner", () => {
  it("links Create or activate categories to /admin/gallery-categories", () => {
    renderWithProviders(<GalleryNoCategoriesBanner />);

    expect(
      screen.getByRole("link", { name: "Create or activate categories" }),
    ).toHaveAttribute("href", "/admin/gallery-categories");
  });
});
