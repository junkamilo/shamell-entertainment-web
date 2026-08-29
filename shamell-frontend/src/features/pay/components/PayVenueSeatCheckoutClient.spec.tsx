/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { fetchVenueSeatCheckoutClientSecret } from "../services/fetchVenueSeatCheckout";

vi.mock("../services/fetchVenueSeatCheckout", () => ({
  fetchVenueSeatCheckoutClientSecret: vi.fn(),
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
      data-fetch={
        fetchClientSecret === fetchVenueSeatCheckoutClientSecret
          ? "venue-seat"
          : "other"
      }
    />
  ),
}));

import { PayVenueSeatCheckoutClient } from "./PayVenueSeatCheckoutClient";

describe("PayVenueSeatCheckoutClient", () => {
  it("wires the venue-seat pay token into PayTokenCheckoutClient", () => {
    render(<PayVenueSeatCheckoutClient token="seat-token" />);

    const host = screen.getByTestId("pay-token-checkout");
    expect(host).toHaveAttribute("data-token", "seat-token");
    expect(host).toHaveAttribute(
      "data-aria",
      "Complete your seat reservation payment",
    );
    expect(host).toHaveAttribute("data-fetch", "venue-seat");
  });
});
