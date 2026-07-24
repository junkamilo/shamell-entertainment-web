/** @vitest-environment jsdom */

import type React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStandaloneChairItem } from "../test/fixtures/venueTables.fixture";
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

import StandaloneChairEditPriceModal from "./StandaloneChairEditPriceModal";

describe("StandaloneChairEditPriceModal", () => {
  it("does not render when chair is null", () => {
    renderWithProviders(
      <StandaloneChairEditPriceModal
        chair={null}
        unitPriceInput="35"
        onUnitPriceChange={vi.fn()}
        isSaving={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders chair details and pricing fields when open", () => {
    const chair = makeStandaloneChairItem();
    renderWithProviders(
      <StandaloneChairEditPriceModal
        chair={chair}
        unitPriceInput="35"
        onUnitPriceChange={vi.fn()}
        isSaving={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Edit chair price" }),
    ).toBeInTheDocument();
    expect(screen.getByText(chair.displayLabel)).toBeInTheDocument();
    expect(screen.getByText("Unit price (each chair)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save price" })).toBeInTheDocument();
  });

  it("calls onConfirm and onClose from actions", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const chair = makeStandaloneChairItem();

    renderWithProviders(
      <StandaloneChairEditPriceModal
        chair={chair}
        unitPriceInput="35"
        onUnitPriceChange={vi.fn()}
        isSaving={false}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save price" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
