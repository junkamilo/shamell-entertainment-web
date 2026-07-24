/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "", src }: { alt?: string; src: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

import HeaderMediaFocusMedia from "./HeaderMediaFocusMedia";

describe("HeaderMediaFocusMedia", () => {
  it("renders image when not video", () => {
    renderWithProviders(
      <div className="relative h-20 w-20">
        <HeaderMediaFocusMedia
          url="https://cdn.example.com/header/photo.jpg"
          isVideo={false}
          objectPosition="50% 35%"
          className="object-cover"
        />
      </div>,
    );
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://cdn.example.com/header/photo.jpg",
    );
  });

  it("renders video when isVideo", () => {
    const { container } = renderWithProviders(
      <div className="relative h-20 w-20">
        <HeaderMediaFocusMedia
          url="https://cdn.example.com/header/video.mp4"
          isVideo
          objectPosition="50% 35%"
          className="object-cover"
        />
      </div>,
    );
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "https://cdn.example.com/header/video.mp4",
    );
  });
});
