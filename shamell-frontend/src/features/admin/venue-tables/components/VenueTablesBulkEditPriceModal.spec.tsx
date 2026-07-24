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

import VenueTablesBulkEditPriceModal from "./VenueTablesBulkEditPriceModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof VenueTablesBulkEditPriceModal>> = {},
) {
  const props: React.ComponentProps<typeof VenueTablesBulkEditPriceModal> = {
    open: true,
    size: "LARGE",
    tableCount: 4,
    bundlePriceInput: "250",
    onBundlePriceChange: vi.fn(),
    isSaving: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<VenueTablesBulkEditPriceModal {...props} />), props };
}

describe("VenueTablesBulkEditPriceModal", () => {
  it("renders bulk edit title and table count", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "Edit all Large table prices" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/4 active large tables/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("250")).toBeInTheDocument();
  });

  it("calls onConfirm from Update all prices", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Update all prices" }));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    renderModal({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
