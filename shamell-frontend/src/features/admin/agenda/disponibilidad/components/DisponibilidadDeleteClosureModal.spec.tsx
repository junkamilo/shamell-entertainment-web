/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, it, expect, vi } from "vitest";
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
    children: ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button onClick={onClose}>x</button>
      </div>
    ) : null,
}));

import DisponibilidadDeleteClosureModal from "./DisponibilidadDeleteClosureModal";

describe("DisponibilidadDeleteClosureModal", () => {
  it("renders nothing when confirmClosureId is null", () => {
    renderWithProviders(
      <DisponibilidadDeleteClosureModal
        confirmClosureId={null}
        onClose={vi.fn()}
        onConfirmDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the 'Delete closure' title when open", () => {
    renderWithProviders(
      <DisponibilidadDeleteClosureModal
        confirmClosureId="id-1"
        onClose={vi.fn()}
        onConfirmDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Delete closure" })).toBeInTheDocument();
  });

  it("calls onClose from CLOSE", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <DisponibilidadDeleteClosureModal
        confirmClosureId="id-1"
        onClose={onClose}
        onConfirmDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "CLOSE" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirmDelete from DELETE", async () => {
    const user = userEvent.setup();
    const onConfirmDelete = vi.fn();
    renderWithProviders(
      <DisponibilidadDeleteClosureModal
        confirmClosureId="id-1"
        onClose={vi.fn()}
        onConfirmDelete={onConfirmDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "DELETE" }));
    expect(onConfirmDelete).toHaveBeenCalledOnce();
  });
});
