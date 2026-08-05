/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { render } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("session_id=cs_test_quote"),
}));

vi.mock("@/components/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared")>();
  return {
    ...actual,
    SiteHeader: () => <header data-testid="site-header" />,
    Footer: () => <footer data-testid="site-footer" />,
  };
});

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { PayQuoteReturnClient } from "./PayQuoteReturnClient";

describe("PayQuoteReturnClient", () => {
  it("polls quote session status and shows confirmation", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/quote/session-status", () =>
        HttpResponse.json({
          stripeStatus: "complete",
          paymentStatus: "PAID",
          stage: "PAID",
          amount: 150,
          currency: "usd",
          customerName: "Ada Lovelace",
          customerEmail: "ada@example.com",
        }),
      ),
    );
    render(<PayQuoteReturnClient />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment confirmed" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/Thank you, Ada Lovelace/i)).toBeInTheDocument();
  });
});
