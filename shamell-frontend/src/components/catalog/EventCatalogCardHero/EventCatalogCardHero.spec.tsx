/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCatalogCardHero } from "./EventCatalogCardHero";

vi.mock("@/components/shared", () => ({
  useCatalogSlideActive: () => true,
}));

vi.mock("@/components/media", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/media")>();
  return {
    ...actual,
    CardMedia: ({
      mediaType,
      alt,
      imageUrl,
      videoUrl,
    }: {
      mediaType: string;
      alt: string;
      imageUrl?: string | null;
      videoUrl?: string | null;
    }) => (
      <div
        data-testid="card-media"
        data-media-type={mediaType}
        data-image={imageUrl ?? ""}
        data-video={videoUrl ?? ""}
      >
        {alt}
      </div>
    ),
  };
});

describe("EventCatalogCardHero", () => {
  it("renders placeholder when there is no media", () => {
    const { container } = render(
      <EventCatalogCardHero imageUrl={null} title="Private gala" />,
    );
    expect(screen.queryByTestId("card-media")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("renders IMAGE media via CardMedia", () => {
    render(
      <EventCatalogCardHero
        imageUrl="https://cdn.example/photo.jpg"
        mediaType="IMAGE"
        title="Private gala"
      />,
    );
    const media = screen.getByTestId("card-media");
    expect(media).toHaveAttribute("data-media-type", "IMAGE");
    expect(media).toHaveAttribute("data-image", "https://cdn.example/photo.jpg");
    expect(media).toHaveTextContent("Private gala");
  });

  it("renders VIDEO media with poster and video url", () => {
    render(
      <EventCatalogCardHero
        imageUrl="https://cdn.example/clip.mp4"
        mediaType="VIDEO"
        posterUrl="https://cdn.example/poster.jpg"
        videoUrl="https://cdn.example/clip.mp4"
        title="Show reel"
      />,
    );
    const media = screen.getByTestId("card-media");
    expect(media).toHaveAttribute("data-media-type", "VIDEO");
    expect(media).toHaveAttribute("data-video", "https://cdn.example/clip.mp4");
  });
});
