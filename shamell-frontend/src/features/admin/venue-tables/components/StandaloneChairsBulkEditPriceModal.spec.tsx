/** @vitest-environment jsdom */

import type React from "react";
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
          Close modal
        </button>
      </div>
    ) : null,
}));

import StandaloneChairsBulkEditPriceModal from "./StandaloneChairsBulkEditPriceModal";

describe("StandaloneChairsBulkEditPriceModal", () => {
  it("does not render when closed", () => {
    renderWithProviders(
      <StandaloneChairsBulkEditPriceModal
        open={false}
        chairCount={5}
        unitPriceInput="35"
        onUnitPriceChange={vi.fn()}
        isSaving={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders chair count and pricing fields when open", () => {
    renderWithProviders(
      <StandaloneChairsBulkEditPriceModal
        open
        chairCount={5}
        unitPriceInput="35"
        onUnitPriceChange={vi.fn()}
        isSaving={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Edit all chair prices" }),
    ).toBeInTheDocument();
    expect(screen.getByText("5 active chairs")).toBeInTheDocument();
    expect(screen.getByText("Unit price (each chair)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update all prices" })).toBeInTheDocument();
  });

  it("calls onConfirm when Update all prices is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(
      <StandaloneChairsBulkEditPriceModal
        open
        chairCount={2}
        unitPriceInput="40"
        onUnitPriceChange={vi.fn()}
        isSaving={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Update all prices" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
