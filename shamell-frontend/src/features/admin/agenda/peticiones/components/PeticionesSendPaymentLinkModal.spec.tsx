/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeAdminBookingRow } from "../test/fixtures/peticiones.fixture";

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

import PeticionesSendPaymentLinkModal from "./PeticionesSendPaymentLinkModal";

describe("PeticionesSendPaymentLinkModal", () => {
  it("renders nothing when closed", () => {
    renderWithProviders(
      <PeticionesSendPaymentLinkModal
        booking={makeAdminBookingRow()}
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("submits a full payment quote with defaults", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PeticionesSendPaymentLinkModal
        booking={makeAdminBookingRow({ guestFullName: "Ada Guest" })}
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    expect(
      screen.getByRole("dialog", { name: "Send payment link" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Ada Guest/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Send payment link/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      paymentModel: "FULL",
      totalAmount: 2500,
    });
  });

  it("validates deposit amounts", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PeticionesSendPaymentLinkModal
        booking={makeAdminBookingRow()}
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Deposit/i }));
    const depositInput = screen.getByPlaceholderText("1000");
    await user.clear(depositInput);
    await user.type(depositInput, "3000");
    await user.click(screen.getByRole("button", { name: /Send payment link/i }));
    expect(
      screen.getByText("Deposit must be less than the total price."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <PeticionesSendPaymentLinkModal
        booking={makeAdminBookingRow()}
        isOpen
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
