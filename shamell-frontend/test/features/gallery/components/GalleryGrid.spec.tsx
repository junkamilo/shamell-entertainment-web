/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/gallery/support/helpers/renderWithProviders";
import { makeGalleryPhotoItem } from "@test/features/gallery/support/fixtures/gallery.fixture";

vi.mock("@/features/gallery/components/GalleryMediaCard", () => ({
  GalleryMediaCard: ({ item }: { item: { alt: string } }) => (
    <div data-testid="media-card">{item.alt}</div>
  ),
}));

import { GalleryGrid } from "@/features/gallery/components/GalleryGrid";

describe("GalleryGrid", () => {
  it("shows loading text when loading", () => {
    renderWithProviders(<GalleryGrid photos={[]} isLoading />);
    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
  });

  it("renders a card per photo", () => {
    renderWithProviders(
      <GalleryGrid
        photos={[
          makeGalleryPhotoItem(),
          makeGalleryPhotoItem({ id: "2", alt: "Shows — gallery" }),
        ]}
        isLoading={false}
      />,
    );
    expect(screen.getAllByTestId("media-card")).toHaveLength(2);
    expect(screen.getByText("Weddings — gallery")).toBeInTheDocument();
  });
});
