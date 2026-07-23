/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutDeleteHeroModal } from "./AboutDeleteHeroModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof AboutDeleteHeroModal>> = {},
) {
  const props: React.ComponentProps<typeof AboutDeleteHeroModal> = {
    isOpen: true,
    isDeletingHero: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<AboutDeleteHeroModal {...props} />), props };
}

describe("AboutDeleteHeroModal", () => {
  it("shows the confirm title when open", async () => {
    renderModal();
    expect(
      await screen.findByRole("heading", { name: /remove hero media/i }),
    ).toBeInTheDocument();
  });

  it("calls onClose from CANCEL", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm from REMOVE", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: /^remove$/i }));
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });

  it("disables actions while deleting", () => {
    renderModal({ isDeletingHero: true });
    expect(screen.getByRole("button", { name: /removing/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^cancel$/i })).toBeDisabled();
  });
});
