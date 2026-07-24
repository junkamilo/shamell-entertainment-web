/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}));

import { VenueLayoutPromoEditModal } from "./VenueLayoutPromoEditModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof VenueLayoutPromoEditModal>> = {},
) {
  const props: React.ComponentProps<typeof VenueLayoutPromoEditModal> = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    promoTitle: "On Coming Events",
    setPromoTitle: vi.fn(),
    promoDescription: "Reserve seats for our next night.",
    setPromoDescription: vi.fn(),
    isSubmitting: false,
    ...overrides,
  };
  return {
    ...renderWithProviders(<VenueLayoutPromoEditModal {...props} />),
    props,
  };
}

describe("VenueLayoutPromoEditModal", () => {
  it("renders edit home section dialog", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "Edit home On Coming Events section" }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("On Coming Events")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("notifies setPromoTitle when typing", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(screen.getByPlaceholderText("ON COMING EVENTS"), "!");
    expect(props.setPromoTitle).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
