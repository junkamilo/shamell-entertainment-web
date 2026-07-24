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

import VenueTablesBulkDeleteModal from "./VenueTablesBulkDeleteModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof VenueTablesBulkDeleteModal>> = {},
) {
  const props: React.ComponentProps<typeof VenueTablesBulkDeleteModal> = {
    pending: { scope: "ALL", count: 5 },
    isDeleting: false,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<VenueTablesBulkDeleteModal {...props} />), props };
}

describe("VenueTablesBulkDeleteModal", () => {
  it("renders delete-all copy when open", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "Delete all tables" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/5 all tables/)).toBeInTheDocument();
  });

  it("calls onConfirm from Delete permanently", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it("does not render when pending is null", () => {
    renderModal({ pending: null });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
