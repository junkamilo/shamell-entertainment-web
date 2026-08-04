/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockGalleryPageState } from "../test/helpers/mockGalleryPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useGalleryPage", () => ({
  useGalleryPage: () => createMockGalleryPageState(),
}));

vi.mock("./GalleryHero", () => ({
  GalleryHero: () => <div data-testid="gallery-hero" />,
}));

vi.mock("./GalleryFilterTabs", () => ({
  GalleryFilterTabs: ({
    currentFilter,
  }: {
    currentFilter: string;
  }) => <div data-testid="gallery-tabs">{currentFilter}</div>,
}));

vi.mock("./GalleryGrid", () => ({
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

import { GalleryPageContent } from "./GalleryPageContent";

describe("GalleryPageContent", () => {
  it("composes hero, tabs, and grid from page state", () => {
    renderWithProviders(<GalleryPageContent />);
    expect(screen.getByTestId("gallery-hero")).toBeInTheDocument();
    expect(screen.getByTestId("gallery-tabs")).toHaveTextContent("all");
    expect(screen.getByTestId("gallery-grid")).toHaveTextContent("2 photos");
  });
});
