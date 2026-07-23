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

import MiAgendaCancelModal from "./MiAgendaCancelModal";

describe("MiAgendaCancelModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(
      <MiAgendaCancelModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the cancel dialog when open", () => {
    renderWithProviders(
      <MiAgendaCancelModal isOpen onClose={vi.fn()} onConfirm={vi.fn()} />,
    );
    expect(screen.getByRole("dialog", { name: "Cancel booking" })).toBeInTheDocument();
    expect(screen.getByText(/CANCELLED/)).toBeInTheDocument();
  });

  it("calls onClose from CLOSE", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <MiAgendaCancelModal isOpen onClose={onClose} onConfirm={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: "CLOSE" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onConfirm from CONFIRM CANCELLATION", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithProviders(
      <MiAgendaCancelModal isOpen onClose={vi.fn()} onConfirm={onConfirm} />,
    );
    await user.click(screen.getByRole("button", { name: "CONFIRM CANCELLATION" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
