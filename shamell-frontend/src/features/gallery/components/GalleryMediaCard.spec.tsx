/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeGalleryPhotoItem } from "../test/fixtures/gallery.fixture";

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

import { GalleryMediaCard } from "./GalleryMediaCard";

describe("GalleryMediaCard", () => {
  it("renders image for IMAGE media", () => {
    renderWithProviders(
      <GalleryMediaCard item={makeGalleryPhotoItem()} />,
    );
    expect(
      screen.getByRole("img", { name: "Weddings — gallery" }),
    ).toHaveAttribute(
      "src",
      "https://cdn.example.com/gallery/wedding-1.jpg",
    );
  });

  it("renders video for VIDEO media", () => {
    const { container } = renderWithProviders(
      <GalleryMediaCard
        item={makeGalleryPhotoItem({
          mediaType: "VIDEO",
          src: "https://cdn.example.com/gallery/show-1.mp4",
          alt: "Shows — gallery",
        })}
      />,
    );
    const video = container.querySelector("video");
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute(
      "src",
      "https://cdn.example.com/gallery/show-1.mp4",
    );
    expect(video).toHaveAttribute("aria-label", "Shows — gallery");
  });
});
