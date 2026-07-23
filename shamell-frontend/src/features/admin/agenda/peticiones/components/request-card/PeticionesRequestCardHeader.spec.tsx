/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  makeAdminBookingRow,
  makeContactRequest,
} from "../../test/fixtures/peticiones.fixture";

vi.mock("./PeticionesRequestCardPaymentBadge", () => ({
  default: () => <span data-testid="payment-badge">NEW</span>,
}));

import PeticionesRequestCardHeader from "./PeticionesRequestCardHeader";

describe("PeticionesRequestCardHeader", () => {
  it("renders client name, email, and subject for a contact", () => {
    renderWithProviders(
      <PeticionesRequestCardHeader
        expanded={false}
        onToggle={vi.fn()}
        clientDisplayName="Ada Lovelace"
        clientDisplayEmail="ada@example.com"
        createdAt="2026-07-20T12:00:00.000Z"
        contact={makeContactRequest()}
        booking={null}
        bookingPaymentVisual={null}
        isReserved={false}
        isCancelled={false}
      />,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("payment-badge")).toBeInTheDocument();
  });

  it("calls onToggle when clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithProviders(
      <PeticionesRequestCardHeader
        expanded
        onToggle={onToggle}
        clientDisplayName="Ada Guest"
        clientDisplayEmail="ada@example.com"
        createdAt="2026-07-20T12:00:00.000Z"
        contact={null}
        booking={makeAdminBookingRow()}
        bookingPaymentVisual="awaiting_payment"
        isReserved={false}
        isCancelled={false}
      />,
    );
    await user.click(screen.getByRole("button"));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(screen.getByText(/Gala night|Admin booking/)).toBeInTheDocument();
  });
});
