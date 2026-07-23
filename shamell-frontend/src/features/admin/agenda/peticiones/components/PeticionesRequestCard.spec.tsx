/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import {
  makeBookingRow,
  makeContactRow,
} from "../test/fixtures/peticiones.fixture";

vi.mock("./request-card/PeticionesRequestCardHeader", () => ({
  default: ({
    clientDisplayName,
    onToggle,
  }: {
    clientDisplayName: string;
    onToggle: () => void;
  }) => (
    <button type="button" onClick={onToggle} data-testid="card-header">
      {clientDisplayName}
    </button>
  ),
}));

vi.mock("./request-card/PeticionesRequestCardContactBody", () => ({
  default: () => <div data-testid="contact-body" />,
}));

vi.mock("./request-card/PeticionesRequestCardBookingBody", () => ({
  default: () => <div data-testid="booking-body" />,
}));

vi.mock("./request-card/PeticionesRequestCardActions", () => ({
  default: ({ onOpenPaymentLink }: { onOpenPaymentLink: () => void }) => (
    <button type="button" onClick={onOpenPaymentLink} data-testid="card-actions">
      stub-open-payment
    </button>
  ),
}));

vi.mock("./PeticionesSendPaymentLinkModal", () => ({
  default: ({
    isOpen,
    onSubmit,
  }: {
    isOpen: boolean;
    onSubmit: (payload: {
      paymentModel: "FULL";
      totalAmount: number;
    }) => void;
  }) =>
    isOpen ? (
      <div data-testid="payment-modal">
        <button
          type="button"
          onClick={() => onSubmit({ paymentModel: "FULL", totalAmount: 100 })}
        >
          stub-submit-quote
        </button>
      </div>
    ) : null,
}));

import PeticionesRequestCard from "./PeticionesRequestCard";

const baseProps = {
  expanded: true,
  onToggle: vi.fn(),
  onCancel: vi.fn(),
  onRemove: vi.fn(),
  onReserveFromContact: vi.fn(),
  onCancelBooking: vi.fn(),
  onRemoveBooking: vi.fn(),
  onSendBookingQuote: vi.fn(),
  onSendBalanceLink: vi.fn(),
  busyId: null,
  reservingContactId: null,
  serviceByInquiryCode: new Map(),
  eventTypeContactCodeById: new Map(),
  inquiryCodeByCatalogLineId: new Map(),
  bookingTz: "America/New_York",
};

describe("PeticionesRequestCard", () => {
  it("renders contact card header and expanded body", () => {
    renderWithProviders(
      <PeticionesRequestCard row={makeContactRow()} {...baseProps} />,
    );
    expect(screen.getByTestId("card-header")).toHaveTextContent("Ada Lovelace");
    expect(screen.getByTestId("contact-body")).toBeInTheDocument();
    expect(screen.getByTestId("booking-body")).toBeInTheDocument();
    expect(screen.getByTestId("card-actions")).toBeInTheDocument();
  });

  it("opens payment modal for booking and submits quote", async () => {
    const user = userEvent.setup();
    const onSendBookingQuote = vi.fn();
    const row = makeBookingRow();
    renderWithProviders(
      <PeticionesRequestCard
        row={row}
        {...baseProps}
        onSendBookingQuote={onSendBookingQuote}
      />,
    );
    await user.click(screen.getByRole("button", { name: "stub-open-payment" }));
    expect(screen.getByTestId("payment-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "stub-submit-quote" }));
    expect(onSendBookingQuote).toHaveBeenCalledWith(row.booking, {
      paymentModel: "FULL",
      totalAmount: 100,
    });
  });

  it("calls onToggle from header", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithProviders(
      <PeticionesRequestCard
        row={makeContactRow()}
        {...baseProps}
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getByTestId("card-header"));
    expect(onToggle).toHaveBeenCalledOnce();
  });
});
