/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  makeGalleryCategory,
  makeGalleryPhoto,
} from "../test/fixtures/gallery.fixture";
import { FIXTURE_CATEGORY_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./GalleryAlbumSection", () => ({
  default: ({
    category,
    photos,
  }: {
    category: { name: string };
    photos: unknown[];
  }) => (
    <div data-testid={`album-${category.name}`}>
      {photos.length} photos
    </div>
  ),
}));

import GalleryLibrarySection from "./GalleryLibrarySection";

function renderLibrary(
  overrides: Partial<React.ComponentProps<typeof GalleryLibrarySection>> = {},
) {
  const props: React.ComponentProps<typeof GalleryLibrarySection> = {
    isLoading: false,
    photosCount: 1,
    filteredPhotosCount: 1,
    categoriesForLibrary: [makeGalleryCategory()],
    filteredPhotos: [makeGalleryPhoto()],
    expandedAlbumIds: new Set([FIXTURE_CATEGORY_ID]),
    onToggleAlbumExpanded: vi.fn(),
    onUploadToCategory: vi.fn(),
    onEditPhoto: vi.fn(),
    onDeletePhoto: vi.fn(),
    onTogglePhoto: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<GalleryLibrarySection {...props} />), props };
}

describe("GalleryLibrarySection", () => {
  it("renders Media library heading and albums", () => {
    renderLibrary();
    expect(screen.getByRole("heading", { name: "Media library" })).toBeInTheDocument();
    expect(screen.getByTestId("album-Weddings")).toHaveTextContent("1 photos");
  });

  it("shows Loading when isLoading", () => {
    renderLibrary({ isLoading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty catalog message when no media", () => {
    renderLibrary({
      photosCount: 0,
      filteredPhotosCount: 0,
      filteredPhotos: [],
    });
    expect(
      screen.getByText(/No media yet/i),
    ).toBeInTheDocument();
  });

  it("shows no-match message when filter empties results", () => {
    renderLibrary({
      photosCount: 2,
      filteredPhotosCount: 0,
      filteredPhotos: [],
    });
    expect(
      screen.getByText("Nothing matches the filter or search."),
    ).toBeInTheDocument();
  });
});
