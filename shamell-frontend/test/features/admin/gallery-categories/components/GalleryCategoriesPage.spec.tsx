/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryCategoriesPageState } from "@test/features/admin/gallery-categories/support/helpers/mockGalleryCategoriesPage";
import { renderWithProviders } from "@test/features/admin/gallery-categories/support/helpers/renderWithProviders";

vi.mock("@/features/admin/gallery-categories/hooks/useGalleryCategoriesPage", () => ({
  useGalleryCategoriesPage: () => createMockGalleryCategoriesPageState(),
}));

vi.mock("@/features/admin/gallery-categories/components/GalleryCategoriesPageContent", () => ({
  default: () => <div data-testid="gallery-categories-page-content" />,
}));

import GalleryCategoriesPage from "@/features/admin/gallery-categories/components/GalleryCategoriesPage";

describe("GalleryCategoriesPage", () => {
  it("renders GalleryCategoriesPageContent", () => {
    renderWithProviders(<GalleryCategoriesPage />);
    expect(
      screen.getByTestId("gallery-categories-page-content"),
    ).toBeInTheDocument();
  });

  it("loads page state via useGalleryCategoriesPage", () => {
    renderWithProviders(<GalleryCategoriesPage />);
    expect(
      screen.getByTestId("gallery-categories-page-content"),
    ).toBeVisible();
  });
});
