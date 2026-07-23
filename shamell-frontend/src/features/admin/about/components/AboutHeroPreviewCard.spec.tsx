/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutHeroPreviewCard } from "./AboutHeroPreviewCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof AboutHeroPreviewCard>> = {},
) {
  const props: React.ComponentProps<typeof AboutHeroPreviewCard> = {
    src: "https://cdn.test/hero.jpg",
    isVideo: false,
    badge: "Live on site",
    onRemove: vi.fn(),
    removeAriaLabel: "Remove published hero",
    onExpand: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<AboutHeroPreviewCard {...props} />), props };
}

describe("AboutHeroPreviewCard", () => {
  it("shows the badge and an image when not video", () => {
    renderCard();
    expect(screen.getByText("Live on site")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeTruthy();
    expect(document.querySelector("video")).toBeNull();
  });

  it("renders a video element when isVideo", () => {
    renderCard({ isVideo: true, src: "https://cdn.test/hero.mp4" });
    expect(document.querySelector("video")).toBeTruthy();
  });

  it("calls onExpand from the preview button", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();
    await user.click(screen.getByRole("button", { name: /view full size/i }));
    expect(props.onExpand).toHaveBeenCalledOnce();
  });

  it("calls onRemove and disables remove while busy", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderCard({ onRemove, removeDisabled: true, removeBusy: true });

    const remove = screen.getByRole("button", { name: /remove published hero/i });
    expect(remove).toBeDisabled();
    await user.click(remove);
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("invokes onRemove when enabled", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderCard({ onRemove });
    await user.click(screen.getByRole("button", { name: /remove published hero/i }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
