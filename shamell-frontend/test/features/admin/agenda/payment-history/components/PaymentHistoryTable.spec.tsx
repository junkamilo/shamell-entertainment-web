/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makePaymentRow } from "@test/features/admin/agenda/payment-history/support/fixtures/paymentHistory.fixture";
import { renderWithProviders } from "@test/features/admin/agenda/payment-history/support/helpers/renderWithProviders";
import PaymentHistoryTable from "@/features/admin/agenda/payment-history/components/PaymentHistoryTable";

describe("PaymentHistoryTable", () => {
  it("renders payment rows", () => {
    renderWithProviders(
      <PaymentHistoryTable
        items={[makePaymentRow()]}
        onViewPayment={vi.fn()}
      />,
    );
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.getByText("Book")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("calls onViewPayment from View", async () => {
    const user = userEvent.setup();
    const onViewPayment = vi.fn();
    const row = makePaymentRow();
    renderWithProviders(
      <PaymentHistoryTable items={[row]} onViewPayment={onViewPayment} />,
    );
    await user.click(screen.getByRole("button", { name: "View" }));
    expect(onViewPayment).toHaveBeenCalledWith(row);
  });
});
