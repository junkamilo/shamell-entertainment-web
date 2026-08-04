/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaPreviewModal } from "./MediaPreviewModal";

describe("MediaPreviewModal", () => {
  it("renders an image when mediaType is IMAGE", () => {
    render(
      <MediaPreviewModal
        isOpen
        onClose={vi.fn()}
        src="https://cdn.example/photo.jpg"
        title="Photo"
        mediaType="IMAGE"
        alt="Hero"
      />,
    );
    expect(screen.getByRole("dialog", { name: "Photo" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute(
      "src",
      "https://cdn.example/photo.jpg",
    );
  });

  it("renders a video when mediaType is VIDEO", () => {
    render(
      <MediaPreviewModal
        isOpen
        onClose={vi.fn()}
        src="https://cdn.example/clip.mp4"
        title="Clip"
        mediaType="VIDEO"
      />,
    );
    const video = document.querySelector("video");
    expect(video).toBeTruthy();
    expect(video).toHaveAttribute("src", "https://cdn.example/clip.mp4");
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MediaPreviewModal
        isOpen
        onClose={onClose}
        src="https://cdn.example/photo.jpg"
        mediaType="IMAGE"
      />,
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on backdrop click but not on dialog click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <MediaPreviewModal
        isOpen
        onClose={onClose}
        src="https://cdn.example/photo.jpg"
        title="Photo"
        mediaType="IMAGE"
      />,
    );
    await user.click(screen.getByRole("dialog", { name: "Photo" }));
    expect(onClose).not.toHaveBeenCalled();
    await user.click(screen.getByRole("presentation"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
