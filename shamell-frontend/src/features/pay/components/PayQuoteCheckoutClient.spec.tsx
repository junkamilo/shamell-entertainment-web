/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { fetchQuoteCheckoutClientSecret } from "../services/fetchQuoteCheckout";

vi.mock("../services/fetchQuoteCheckout", () => ({
  fetchQuoteCheckoutClientSecret: vi.fn(),
}));

vi.mock("./PayTokenCheckoutClient", () => ({
  PayTokenCheckoutClient: ({
    token,
    ariaLabel,
    fetchClientSecret,
  }: {
    token: string;
    ariaLabel: string;
    fetchClientSecret: unknown;
  }) => (
    <div
      data-testid="pay-token-checkout"
      data-token={token}
      data-aria={ariaLabel}
      data-fetch={fetchClientSecret === fetchQuoteCheckoutClientSecret ? "quote" : "other"}
    />
  ),
}));

import { PayQuoteCheckoutClient } from "./PayQuoteCheckoutClient";

describe("PayQuoteCheckoutClient", () => {
  it("wires the quote pay token into PayTokenCheckoutClient", () => {
    render(<PayQuoteCheckoutClient token="quote-token" />);

    const host = screen.getByTestId("pay-token-checkout");
    expect(host).toHaveAttribute("data-token", "quote-token");
    expect(host).toHaveAttribute("data-aria", "Complete your booking payment");
    expect(host).toHaveAttribute("data-fetch", "quote");
  });
});
