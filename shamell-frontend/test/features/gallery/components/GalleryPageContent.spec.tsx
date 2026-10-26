/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryPageState } from "@test/features/gallery/support/helpers/mockGalleryPage";
import { renderWithProviders } from "@test/features/gallery/support/helpers/renderWithProviders";

vi.mock("@/features/gallery/hooks/useGalleryPage", () => ({
  useGalleryPage: () => createMockGalleryPageState(),
}));

vi.mock("@/features/gallery/components/GalleryHero", () => ({
  GalleryHero: () => <div data-testid="gallery-hero" />,
}));

vi.mock("@/features/gallery/components/GalleryFilterTabs", () => ({
  GalleryFilterTabs: ({
    currentFilter,
  }: {
    currentFilter: string;
  }) => <div data-testid="gallery-tabs">{currentFilter}</div>,
}));

vi.mock("@/features/gallery/components/GalleryGrid", () => ({
  GalleryGrid: ({
    isLoading,
    photos,
  }: {
    isLoading: boolean;
    photos: unknown[];
  }) => (
    <div data-testid="gallery-grid">
      {isLoading ? "loading" : `${photos.length} photos`}
    </div>
  ),
}));

import { GalleryPageContent } from "@/features/gallery/components/GalleryPageContent";

describe("GalleryPageContent", () => {
  it("composes hero, tabs, and grid from page state", () => {
    renderWithProviders(<GalleryPageContent />);
    expect(screen.getByTestId("gallery-hero")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-tabs")).toHaveTextContent("all");
    expect(screen.getByTestId("gallery-grid")).toHaveTextContent("2 photos");
  });
});
