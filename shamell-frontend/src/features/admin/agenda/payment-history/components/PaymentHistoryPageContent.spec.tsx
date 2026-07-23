/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockPaymentHistoryPageState } from "../test/helpers/mockPaymentHistoryPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

let pageState = createMockPaymentHistoryPageState();

vi.mock("../hooks/usePaymentHistoryPage", () => ({
  usePaymentHistoryPage: () => pageState,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("./PaymentHistoryFilters", () => ({
  default: ({
    onRefresh,
    onApplySearch,
  }: {
    onRefresh: () => void;
    onApplySearch: () => void;
  }) => (
    <div data-testid="filters">
      <button type="button" onClick={onRefresh}>
        stub-refresh
      </button>
      <button type="button" onClick={onApplySearch}>
        stub-search
      </button>
    </div>
  ),
}));

vi.mock("./PaymentHistoryTable", () => ({
  default: ({
    onViewPayment,
    items,
  }: {
    items: Array<{ id: string; customerName: string }>;
    onViewPayment: (row: { id: string; customerName: string }) => void;
  }) => (
    <div data-testid="table">
      <button type="button" onClick={() => onViewPayment(items[0]!)}>
        stub-view
      </button>
    </div>
  ),
}));

vi.mock("./PaymentHistoryRowCard", () => ({
  default: () => <div data-testid="row-card" />,
}));

vi.mock("./PaymentHistoryDetailModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="detail-modal" /> : null,
}));

vi.mock("@/components/admin/data-display", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

import PaymentHistoryPageContent from "./PaymentHistoryPageContent";

describe("PaymentHistoryPageContent", () => {
  beforeEach(() => {
    pageState = createMockPaymentHistoryPageState();
  });

  it("renders back link, hero, filters, and list", () => {
    renderWithProviders(<PaymentHistoryPageContent />);
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/admin/agenda",
    );
    expect(
      screen.getByRole("heading", { name: /payment history/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("filters")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getAllByTestId("row-card")).toHaveLength(2);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows loading, empty, and error states", () => {
    pageState = createMockPaymentHistoryPageState({
      isLoading: true,
      items: [],
    });
    const { rerender } = renderWithProviders(<PaymentHistoryPageContent />);
    expect(screen.getByText(/Loading payment history/)).toBeInTheDocument();

    pageState = createMockPaymentHistoryPageState({
      isLoading: false,
      items: [],
    });
    rerender(<PaymentHistoryPageContent />);
    expect(screen.getByText("No payments found.")).toBeInTheDocument();

    pageState = createMockPaymentHistoryPageState({
      error: "Not signed in.",
      items: [],
    });
    rerender(<PaymentHistoryPageContent />);
    expect(screen.getByText("Not signed in.")).toBeInTheDocument();
  });

  it("wires refresh and opens the detail modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PaymentHistoryPageContent />);
    await user.click(screen.getByRole("button", { name: "stub-refresh" }));
    expect(pageState.reload).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "stub-view" }));
    expect(screen.getByTestId("detail-modal")).toBeInTheDocument();
  });
});
