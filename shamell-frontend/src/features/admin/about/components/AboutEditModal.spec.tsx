/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutEditModal } from "./AboutEditModal";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof AboutEditModal>> = {},
) {
  const props: React.ComponentProps<typeof AboutEditModal> = {
    record: makeAdminAboutRow(),
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    title: "ABOUT SHAMELL",
    setTitle: vi.fn(),
    paragraph1: "Body",
    setParagraph1: vi.fn(),
    coreValuesText: "Excellence",
    setCoreValuesText: vi.fn(),
    existingImageUrl: null,
    existingHeroMediaType: "IMAGE",
    imageFile: null,
    setImageFile: vi.fn(),
    imagePreviewUrl: null,
    imageFileInputRef: createRef<HTMLInputElement>(),
    isSubmitting: false,
    isDeletingHero: false,
    onOpenDeleteHeroConfirm: vi.fn(),
    onDiscardSelectedFile: vi.fn(),
    onOpenLightbox: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<AboutEditModal {...props} />), props };
}

describe("AboutEditModal", () => {
  it("shows edit title for an existing record", async () => {
    renderModal();
    // Modal fades in (`entered`); assert presence rather than visibility during enter.
    expect(
      await screen.findByRole("heading", { name: /edit about shamell/i }),
    ).toBeInTheDocument();
  });

  it("notifies setTitle when the user types", async () => {
    const user = userEvent.setup();
    const setTitle = vi.fn();
    renderModal({ setTitle, title: "" });

    await user.type(screen.getByLabelText(/title/i), "X");
    expect(setTitle).toHaveBeenCalled();
  });

  it("disables Save while submitting", () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("calls onSubmit when Save is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    renderModal({ onSubmit });

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
