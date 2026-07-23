/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makePaymentRow } from "../test/fixtures/paymentHistory.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import PaymentHistoryRowCard from "./PaymentHistoryRowCard";

describe("PaymentHistoryRowCard", () => {
  it("renders customer and payment summary", () => {
    renderWithProviders(
      <PaymentHistoryRowCard row={makePaymentRow()} onViewPayment={vi.fn()} />,
    );
    expect(screen.getByText("Book")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("Private event booking")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("calls onViewPayment from the details button", async () => {
    const user = userEvent.setup();
    const onViewPayment = vi.fn();
    const row = makePaymentRow();
    renderWithProviders(
      <PaymentHistoryRowCard row={row} onViewPayment={onViewPayment} />,
    );
    await user.click(screen.getByRole("button", { name: /View details/i }));
    expect(onViewPayment).toHaveBeenCalledWith(row);
  });
});
