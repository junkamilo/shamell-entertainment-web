/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "@testing-library/react";
import type { QuotePaymentSessionStatus } from "../services/fetchQuoteCheckout";

const nav = vi.hoisted(() => ({
  mode: "params" as "params" | "suspend",
  params: new URLSearchParams("session_id=cs_test_quote"),
}));

const fetchQuotePaymentSessionStatus = vi.hoisted(() =>
  vi.fn(async (): Promise<QuotePaymentSessionStatus | null> => null),
);

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    if (nav.mode === "suspend") {
      throw new Promise(() => {});
    }
    return nav.params;
  },
}));

vi.mock("@/components/shared", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
  Footer: () => <footer data-testid="site-footer" />,
}));

vi.mock("@/lib/stripe/checkoutReturnPolling", () => ({
  pollCheckoutStatus: vi.fn(
    async ({
      fetchStatus,
      isPaid,
      isExpired,
    }: {
      fetchStatus: () => Promise<QuotePaymentSessionStatus | null>;
      isPaid: (data: QuotePaymentSessionStatus) => boolean;
      isExpired: (data: QuotePaymentSessionStatus) => boolean;
    }) => {
      const data = await fetchStatus();
      if (!data) return { data: null, outcome: "error" as const };
      if (isPaid(data)) return { data, outcome: "paid" as const };
      if (isExpired(data)) return { data, outcome: "expired" as const };
      return { data, outcome: "pending" as const };
    },
  ),
}));

vi.mock("../services/fetchQuoteCheckout", () => ({
  fetchQuotePaymentSessionStatus,
}));

vi.mock("@/features/on-coming-events/components/ClassPaymentConfirmationPanel", () => ({
  ClassPaymentConfirmationFallback: ({ loadingMessage }: { loadingMessage: string }) => (
    <div data-testid="quote-return-fallback">{loadingMessage}</div>
  ),
  ClassPaymentConfirmationPanel: ({
    status,
    paidTitle,
    paidSubtitle,
    paidExtra,
    onRefresh,
  }: {
    status: string;
    paidTitle: string;
    paidSubtitle: string;
    paidExtra: React.ReactNode;
    onRefresh?: () => void;
  }) => (
    <div>
      <p data-testid="status">{status}</p>
      <h1>{paidTitle}</h1>
      <p data-testid="subtitle">{paidSubtitle}</p>
      <div data-testid="extra">{paidExtra}</div>
      {onRefresh ? (
        <button type="button" onClick={onRefresh}>
          refresh
        </button>
      ) : null}
    </div>
  ),
}));

import { PayQuoteReturnClient } from "./PayQuoteReturnClient";

function paidStatus(
  overrides: Partial<QuotePaymentSessionStatus> = {},
): QuotePaymentSessionStatus {
  return {
    stripeStatus: "complete",
    paymentStatus: "PAID",
    stage: "PAID",
    amount: 150,
    currency: "usd",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    ...overrides,
  };
}

describe("PayQuoteReturnClient", () => {
  beforeEach(() => {
    nav.mode = "params";
    nav.params = new URLSearchParams("session_id=cs_test_quote");
    fetchQuotePaymentSessionStatus.mockReset();
    fetchQuotePaymentSessionStatus.mockResolvedValue(paidStatus());
  });

  it("shows the Suspense fallback while search params are pending", () => {
    nav.mode = "suspend";
    render(<PayQuoteReturnClient />);
    expect(screen.getByTestId("quote-return-fallback")).toHaveTextContent(
      "Confirming your payment…",
    );
  });

  it("treats a missing session id as an error", async () => {
    nav.params = new URLSearchParams("");
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });
    expect(fetchQuotePaymentSessionStatus).not.toHaveBeenCalled();
  });

  it("shows paid confirmation with amount, name, and email", async () => {
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("paid");
    });
    expect(screen.getByRole("heading", { name: "Payment confirmed" })).toBeInTheDocument();
    expect(screen.getByTestId("subtitle")).toHaveTextContent(/Thank you, Ada Lovelace/i);
    expect(screen.getByText(/Amount:/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirmation sent to/i)).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("uses generic paid copy when the customer name and email are blank", async () => {
    fetchQuotePaymentSessionStatus.mockResolvedValue(
      paidStatus({ customerName: "", customerEmail: "" }),
    );
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("paid");
    });
    expect(screen.getByTestId("subtitle")).toHaveTextContent(
      "A confirmation was sent to your email.",
    );
    expect(screen.queryByText(/Confirmation sent to/i)).not.toBeInTheDocument();
  });

  it("marks paid when Stripe is still open but paymentStatus is PAID", async () => {
    fetchQuotePaymentSessionStatus.mockResolvedValue(
      paidStatus({ stripeStatus: "open", paymentStatus: "PAID" }),
    );
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("paid");
    });
  });

  it("maps an expired Stripe session to an error", async () => {
    fetchQuotePaymentSessionStatus.mockResolvedValue(
      paidStatus({ stripeStatus: "expired", paymentStatus: "UNPAID" }),
    );
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });
  });

  it("shows pending and reloads when refresh is clicked", async () => {
    fetchQuotePaymentSessionStatus
      .mockResolvedValueOnce(
        paidStatus({ stripeStatus: "open", paymentStatus: "OPEN" }),
      )
      .mockResolvedValueOnce(paidStatus());
    const user = userEvent.setup();
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("pending");
    });
    await user.click(screen.getByRole("button", { name: "refresh" }));
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("paid");
    });
  });

  it("maps a failed poll to an error", async () => {
    fetchQuotePaymentSessionStatus.mockResolvedValue(null);
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });
  });
});
