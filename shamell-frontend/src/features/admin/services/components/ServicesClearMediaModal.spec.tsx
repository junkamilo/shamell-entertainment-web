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
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

import ServicesClearMediaModal from "./ServicesClearMediaModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof ServicesClearMediaModal>> = {},
) {
  const props: React.ComponentProps<typeof ServicesClearMediaModal> = {
    isOpen: true,
    isClearing: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<ServicesClearMediaModal {...props} />),
    props,
  };
}

describe("ServicesClearMediaModal", () => {
  it("shows Remove service media dialog when open", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "Remove service media" }),
    ).toBeInTheDocument();
  });

  it("calls onConfirm from Remove media", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Remove media" }));
    expect(props.onConfirm).toHaveBeenCalledOnce();
  });
});
