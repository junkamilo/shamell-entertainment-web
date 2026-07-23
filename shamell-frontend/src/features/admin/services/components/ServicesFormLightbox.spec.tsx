/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesFormLightbox from "./ServicesFormLightbox";

function renderLightbox(
  overrides: Partial<React.ComponentProps<typeof ServicesFormLightbox>> = {},
) {
  const props: React.ComponentProps<typeof ServicesFormLightbox> = {
    isOpen: true,
    src: "https://cdn.example.com/service.jpg",
    isVideo: false,
    onClose: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<ServicesFormLightbox {...props} />), props };
}

describe("ServicesFormLightbox", () => {
  it("renders null when closed", () => {
    const { container } = renderLightbox({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onClose from Close preview", async () => {
    const user = userEvent.setup();
    const { props } = renderLightbox();

    await user.click(screen.getByRole("button", { name: "Close preview" }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });
});
