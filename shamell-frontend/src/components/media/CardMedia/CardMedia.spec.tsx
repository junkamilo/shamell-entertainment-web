/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardMedia } from "./CardMedia";

vi.mock("@/hooks/use-in-view", () => ({
  useInView: () => ({ ref: vi.fn(), inView: true }),
}));

describe("CardMedia", () => {
  it("renders IMAGE with src alt and loading", () => {
    render(
      <CardMedia
        mediaType="IMAGE"
        imageUrl="https://cdn.example/photo.jpg"
        alt="Hero"
        loading="eager"
      />,
    );
    const img = screen.getByRole("img", { name: "Hero" });
    expect(img).toHaveAttribute("src", "https://cdn.example/photo.jpg");
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("renders nothing for IMAGE without URL", () => {
    const { container } = render(
      <CardMedia mediaType="IMAGE" imageUrl="   " alt="Empty" />,
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("shows VIDEO poster without mounting video when idle", () => {
    render(
      <CardMedia
        mediaType="VIDEO"
        videoUrl="https://cdn.example/clip.mp4"
        posterUrl="https://cdn.example/poster.jpg"
        alt="Clip"
        isActive={false}
      />,
    );
    expect(screen.getByRole("img", { name: "Clip" })).toHaveAttribute(
      "src",
      "https://cdn.example/poster.jpg",
    );
    expect(document.querySelector("video")).toBeNull();
  });

  it("mounts VIDEO when isActive", () => {
    render(
      <CardMedia
        mediaType="VIDEO"
        videoUrl="https://cdn.example/clip.mp4"
        posterUrl="https://cdn.example/poster.jpg"
        alt="Clip"
        isActive
      />,
    );
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute("src", "https://cdn.example/clip.mp4");
  });

  it("mounts VIDEO on hover and removes it on leave", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CardMedia
        mediaType="VIDEO"
        videoUrl="https://cdn.example/clip.mp4"
        posterUrl="https://cdn.example/poster.jpg"
        alt="Clip"
        isActive={false}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(document.querySelector("video")).toBeNull();

    await user.hover(root);
    expect(document.querySelector("video")).toHaveAttribute(
      "src",
      "https://cdn.example/clip.mp4",
    );

    await user.unhover(root);
    expect(document.querySelector("video")).toBeNull();
  });

  it("builds poster srcSet from mobile and desktop posters", () => {
    render(
      <CardMedia
        mediaType="VIDEO"
        videoUrl="https://cdn.example/clip.mp4"
        posterUrl="https://cdn.example/poster-720.jpg"
        posterUrlMobile="https://cdn.example/poster-480.jpg"
        alt="Clip"
        isActive={false}
      />,
    );
    const img = screen.getByRole("img", { name: "Clip" });
    const srcSet = img.getAttribute("srcset") ?? "";
    expect(srcSet).toContain("https://cdn.example/poster-480.jpg 480w");
    expect(srcSet).toContain("https://cdn.example/poster-720.jpg 720w");
  });
});
