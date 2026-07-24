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

import StandaloneChairsDeleteAllModal from "./StandaloneChairsDeleteAllModal";

describe("StandaloneChairsDeleteAllModal", () => {
  it("does not render when closed", () => {
    renderWithProviders(
      <StandaloneChairsDeleteAllModal
        open={false}
        chairCount={3}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders delete warning with chair count", () => {
    renderWithProviders(
      <StandaloneChairsDeleteAllModal
        open
        chairCount={3}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Delete all chairs" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 standalone chairs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeInTheDocument();
  });

  it("uses singular copy for one chair", () => {
    renderWithProviders(
      <StandaloneChairsDeleteAllModal
        open
        chairCount={1}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("1 standalone chair")).toBeInTheDocument();
  });

  it("calls onConfirm when Delete permanently is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderWithProviders(
      <StandaloneChairsDeleteAllModal
        open
        chairCount={2}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete permanently" }));
    expect(onConfirm).toHaveBeenCalled();
  });
});
