/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "", src }: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

import HeaderMediaLibraryMedia from "./HeaderMediaLibraryMedia";

describe("HeaderMediaLibraryMedia", () => {
  it("renders image for IMAGE media", () => {
    renderWithProviders(
      <div className="relative h-20 w-20">
        <HeaderMediaLibraryMedia
          photo={makeHeaderPhoto()}
          className="object-cover"
          style={{ objectPosition: "50% 50%" }}
        />
      </div>,
    );
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://cdn.example.com/header/photo.jpg",
    );
  });

  it("renders video for VIDEO media", () => {
    const { container } = renderWithProviders(
      <div className="relative h-20 w-20">
        <HeaderMediaLibraryMedia
          photo={makeHeaderPhoto({
            mediaType: "VIDEO",
            imageUrl: "https://cdn.example.com/header/video.mp4",
          })}
          className="object-cover"
          style={{ objectPosition: "50% 50%" }}
        />
      </div>,
    );
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "https://cdn.example.com/header/video.mp4",
    );
  });
});
