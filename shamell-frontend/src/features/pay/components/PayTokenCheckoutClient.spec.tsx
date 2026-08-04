/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { render } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/stripe/StripeCheckoutHost", () => ({
  StripeCheckoutHost: ({
    clientSecret,
    ariaLabel,
  }: {
    clientSecret: string;
    ariaLabel?: string;
  }) => (
    <div
      data-testid="stripe-checkout-host"
      data-secret={clientSecret}
      aria-label={ariaLabel}
    />
  ),
}));

import { PayTokenCheckoutClient } from "./PayTokenCheckoutClient";

describe("PayTokenCheckoutClient", () => {
  it("shows Stripe host when fetch succeeds", async () => {
    render(
      <PayTokenCheckoutClient
        token="tok"
        ariaLabel="Pay test"
        fetchClientSecret={async () => ({
          ok: true,
          clientSecret: "cs_ok",
        })}
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout-host")).toHaveAttribute(
        "data-secret",
        "cs_ok",
      );
    });
  });

  it("shows error UI when fetch fails", async () => {
    render(
      <PayTokenCheckoutClient
        token="tok"
        ariaLabel="Pay test"
        fetchClientSecret={async () => ({
          ok: false,
          message: "Link expired",
        })}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Payment unavailable" }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Link expired")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /return to home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
