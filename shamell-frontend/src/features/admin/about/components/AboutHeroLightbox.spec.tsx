/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutHeroLightbox } from "./AboutHeroLightbox";

function renderLightbox(
  overrides: Partial<React.ComponentProps<typeof AboutHeroLightbox>> = {},
) {
  const props: React.ComponentProps<typeof AboutHeroLightbox> = {
    portalReady: true,
    isOpen: true,
    display: { src: "https://cdn.test/hero.jpg", isVideo: false },
    onClose: vi.fn(),
    onExitComplete: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<AboutHeroLightbox {...props} />), props };
}

describe("AboutHeroLightbox", () => {
  it("renders nothing until the portal is ready", () => {
    renderLightbox({ portalReady: false });
    expect(screen.queryByRole("button", { name: /close preview/i })).not.toBeInTheDocument();
  });

  it("shows an image for photo display", () => {
    renderLightbox();
    expect(screen.getByAltText(/expanded about view/i)).toBeInTheDocument();
  });

  it("shows a video for video display", () => {
    renderLightbox({
      display: { src: "https://cdn.test/hero.mp4", isVideo: true },
    });
    expect(screen.getByLabelText(/expanded about view/i).tagName).toBe("VIDEO");
  });

  it("calls onClose from the close button", async () => {
    const user = userEvent.setup();
    const { props } = renderLightbox();
    await user.click(screen.getByRole("button", { name: /close preview/i }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});
