/** @vitest-environment jsdom */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getStripePromise = vi.fn();

vi.mock("@/lib/stripe/client", () => ({
  getStripePromise: (...args: unknown[]) => getStripePromise(...args),
}));

vi.mock("@stripe/react-stripe-js", () => ({
  EmbeddedCheckoutProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div data-testid="embedded-provider">{children}</div>,
  EmbeddedCheckout: () => <div data-testid="embedded-checkout" />,
}));

describe("StripeEmbeddedCheckout", () => {
  const originalKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  beforeEach(() => {
    vi.resetModules();
    getStripePromise.mockReset();
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalKey;
    }
  });

  it("shows error copy when publishable key is missing", async () => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const { StripeEmbeddedCheckout } = await import("./StripeEmbeddedCheckout");
    render(<StripeEmbeddedCheckout clientSecret="cs_test" />);
    expect(
      screen.getByText("Payment form could not load"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/),
    ).toBeInTheDocument();
    expect(getStripePromise).not.toHaveBeenCalled();
  });

  it("shows loading while Stripe promise is pending", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_fixture";
    getStripePromise.mockReturnValue(new Promise(() => {}));
    const { StripeEmbeddedCheckout } = await import("./StripeEmbeddedCheckout");
    render(<StripeEmbeddedCheckout clientSecret="cs_test" />);
    expect(await screen.findByText("Loading payment…")).toBeInTheDocument();
  });

  it("mounts provider when Stripe resolves", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_fixture";
    getStripePromise.mockResolvedValue({ id: "stripe-mock" });
    const { StripeEmbeddedCheckout } = await import("./StripeEmbeddedCheckout");
    render(<StripeEmbeddedCheckout clientSecret="cs_test" />);
    await waitFor(() => {
      expect(screen.getByTestId("embedded-provider")).toBeInTheDocument();
    });
    expect(screen.getByTestId("embedded-checkout")).toBeInTheDocument();
  });
});
