/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockStripeWebhooksPageState } from "../test/helpers/mockStripeWebhooksPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeWebhooksList } from "../test/fixtures/stripeWebhooks.fixture";

let pageState = createMockStripeWebhooksPageState();

vi.mock("../hooks/useStripeWebhooksPage", () => ({
  useStripeWebhooksPage: () => pageState,
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

vi.mock("@/components/admin/data-display", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

import StripeWebhooksPageContent from "./StripeWebhooksPageContent";

describe("StripeWebhooksPageContent", () => {
  beforeEach(() => {
    pageState = createMockStripeWebhooksPageState();
  });

  it("renders back link, hero, filters, and table rows", () => {
    renderWithProviders(<StripeWebhooksPageContent />);
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/admin/agenda",
    );
    expect(
      screen.getByRole("heading", { name: /stripe webhooks/i }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/class_session/i)).toBeInTheDocument();
    expect(
      screen.getAllByText("checkout.session.completed").length,
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows loading, empty, and error states", () => {
    pageState = createMockStripeWebhooksPageState({
      isLoading: true,
      items: [],
    });
    const { rerender } = renderWithProviders(<StripeWebhooksPageContent />);
    expect(screen.getByText(/Loading webhook events/)).toBeInTheDocument();

    pageState = createMockStripeWebhooksPageState({
      isLoading: false,
      items: [],
    });
    rerender(<StripeWebhooksPageContent />);
    expect(screen.getByText("No webhook events found.")).toBeInTheDocument();

    pageState = createMockStripeWebhooksPageState({
      error: "Not signed in.",
      items: [],
    });
    rerender(<StripeWebhooksPageContent />);
    expect(screen.getByText("Not signed in.")).toBeInTheDocument();
  });

  it("wires filters and refresh", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StripeWebhooksPageContent />);

    await user.type(screen.getByPlaceholderText(/class_session/i), "venue");
    expect(pageState.setFlowFilter).toHaveBeenCalled();

    await user.selectOptions(screen.getByDisplayValue("All"), "FAILED");
    expect(pageState.setStatusFilter).toHaveBeenCalledWith("FAILED");
    expect(pageState.setFailedOnly).toHaveBeenCalledWith(false);
    expect(pageState.setPage).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("checkbox"));
    expect(pageState.setFailedOnly).toHaveBeenCalledWith(true);
    expect(pageState.setStatusFilter).toHaveBeenCalledWith("");

    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(pageState.reload).toHaveBeenCalled();
  });

  it("renders failed row error text", () => {
    const list = makeWebhooksList();
    pageState = createMockStripeWebhooksPageState({ items: list.items });
    renderWithProviders(<StripeWebhooksPageContent />);
    expect(screen.getAllByText("Signature mismatch").length).toBeGreaterThan(0);
  });
});
