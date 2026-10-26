/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryPageState } from "@test/features/admin/gallery/support/helpers/mockGalleryPage";
import { renderWithProviders } from "@test/features/admin/gallery/support/helpers/renderWithProviders";

vi.mock("@/features/admin/gallery/hooks/useGalleryPage", () => ({
  useGalleryPage: () => createMockGalleryPageState(),
}));

vi.mock("@/features/admin/gallery/components/GalleryPageContent", () => ({
  default: () => <div data-testid="gallery-page-content" />,
}));

import GalleryPage from "@/features/admin/gallery/components/GalleryPage";

describe("GalleryPage", () => {
  it("renders GalleryPageContent", () => {
    renderWithProviders(<GalleryPage />);
    expect(screen.getByTestId("gallery-page-content")).toBeInTheDocument();
  });

  it("loads page state via useGalleryPage", () => {
    renderWithProviders(<GalleryPage />);
    expect(screen.getByTestId("gallery-page-content")).toBeVisible();
  });
});
