/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/gallery/support/helpers/renderWithProviders";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import GalleryManageCategoriesLink from "@/features/admin/gallery/components/GalleryManageCategoriesLink";

describe("GalleryManageCategoriesLink", () => {
  it("links Manage categories to /admin/gallery-categories", () => {
    renderWithProviders(<GalleryManageCategoriesLink />);

    expect(
      screen.getByRole("link", { name: /Manage categories/i }),
    ).toHaveAttribute("href", "/admin/gallery-categories");
  });
});
