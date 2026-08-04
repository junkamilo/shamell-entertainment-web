/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StripeCheckoutHost } from "./StripeCheckoutHost";

vi.mock("../StripeEmbeddedCheckout", () => ({
  StripeEmbeddedCheckout: ({ clientSecret }: { clientSecret: string }) => (
    <div data-testid="embedded-checkout">{clientSecret}</div>
  ),
}));

describe("StripeCheckoutHost", () => {
  it("renders page layout host without portal", () => {
    const { container } = render(
      <StripeCheckoutHost
        layout="page"
        clientSecret="cs_test_secret"
        ariaLabel="Pay page"
      />,
    );
    const host = container.querySelector(".stripe-checkout-host");
    expect(host).toBeTruthy();
    expect(host).toHaveAttribute("aria-label", "Pay page");
    expect(host).not.toHaveAttribute("role", "dialog");
    expect(screen.getByTestId("embedded-checkout")).toHaveTextContent(
      "cs_test_secret",
    );
    expect(document.body.querySelector(".stripe-checkout-overlay")).toBeNull();
  });

  it("portals overlay layout as dialog on body", async () => {
    render(
      <StripeCheckoutHost
        layout="overlay"
        clientSecret="cs_overlay"
        ariaLabel="Seat payment"
      />,
    );
    const dialog = await screen.findByRole("dialog", { name: "Seat payment" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.className).toContain("stripe-checkout-overlay");
    expect(document.body.contains(dialog)).toBe(true);
    expect(screen.getByTestId("embedded-checkout")).toHaveTextContent(
      "cs_overlay",
    );
  });
});
