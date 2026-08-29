/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { fetchClassPayCheckoutClientSecret } from "../services/fetchClassPayCheckout";

vi.mock("../services/fetchClassPayCheckout", () => ({
  fetchClassPayCheckoutClientSecret: vi.fn(),
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
      data-fetch={fetchClientSecret === fetchClassPayCheckoutClientSecret ? "class" : "other"}
    />
  ),
}));

import { PayClassCheckoutClient } from "./PayClassCheckoutClient";

describe("PayClassCheckoutClient", () => {
  it("wires the class pay token into PayTokenCheckoutClient", () => {
    render(<PayClassCheckoutClient token="class-token" />);

    const host = screen.getByTestId("pay-token-checkout");
    expect(host).toHaveAttribute("data-token", "class-token");
    expect(host).toHaveAttribute("data-aria", "Complete your class payment");
    expect(host).toHaveAttribute("data-fetch", "class");
  });
});
