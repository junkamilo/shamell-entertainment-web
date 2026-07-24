/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeGalleryPhoto } from "../test/fixtures/gallery.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({
    alt = "",
    src,
  }: {
    alt?: string;
    src: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

import GalleryPhotoCard from "./GalleryPhotoCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof GalleryPhotoCard>> = {},
) {
  const props: React.ComponentProps<typeof GalleryPhotoCard> = {
    photo: makeGalleryPhoto(),
    categoryName: "Weddings",
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggle: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<GalleryPhotoCard {...props} />), props };
}

describe("GalleryPhotoCard", () => {
  it("renders image alt for photo media", () => {
    renderCard();
    expect(screen.getByAltText("Medio en Weddings")).toBeInTheDocument();
  });

  it("shows Video badge for video media", () => {
    renderCard({ photo: makeGalleryPhoto({ mediaType: "VIDEO" }) });
    expect(screen.getByText("Video")).toBeInTheDocument();
  });

  it("shows Oculto when inactive", () => {
    renderCard({ photo: makeGalleryPhoto({ isActive: false }) });
    expect(screen.getByText("Oculto")).toBeInTheDocument();
  });

  it("calls onEdit, onDelete, and onToggle", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();

    await user.click(screen.getByRole("button", { name: "Edit media" }));
    await user.click(screen.getByRole("button", { name: "Delete media" }));
    await user.click(screen.getByRole("button", { name: "Hide on site" }));

    expect(props.onEdit).toHaveBeenCalled();
    expect(props.onDelete).toHaveBeenCalled();
    expect(props.onToggle).toHaveBeenCalled();
  });
});
