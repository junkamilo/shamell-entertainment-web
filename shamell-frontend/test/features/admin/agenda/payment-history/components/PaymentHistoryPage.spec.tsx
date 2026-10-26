/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agenda/payment-history/support/helpers/renderWithProviders";

vi.mock("@/features/admin/agenda/payment-history/components/PaymentHistoryPageContent", () => ({
  default: () => <div data-testid="payment-history-page-content" />,
}));

import PaymentHistoryPage from "@/features/admin/agenda/payment-history/components/PaymentHistoryPage";

describe("PaymentHistoryPage", () => {
  it("renders the page content shell", () => {
    renderWithProviders(<PaymentHistoryPage />);
    expect(screen.getByTestId("payment-history-page-content")).toBeInTheDocument();
  });
});
