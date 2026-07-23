/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./PaymentHistoryPageContent", () => ({
  default: () => <div data-testid="payment-history-page-content" />,
}));

import PaymentHistoryPage from "./PaymentHistoryPage";

describe("PaymentHistoryPage", () => {
  it("renders the page content shell", () => {
    renderWithProviders(<PaymentHistoryPage />);
    expect(screen.getByTestId("payment-history-page-content")).toBeInTheDocument();
  });
});
