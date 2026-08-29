/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const checkoutMock = vi.fn();

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div data-testid="stripe-checkout">{ariaLabel}</div>
  ),
}));

vi.mock("../lib/usePublicCheckoutModalLock", () => ({
  usePublicCheckoutModalLock: () => undefined,
}));

vi.mock("../services/createFixedEventCheckoutSession", () => ({
  createFixedEventCheckoutSession: (...args: unknown[]) => checkoutMock(...args),
}));

import { OnComingEventFixedTicketBookingModal } from "./OnComingEventFixedTicketBookingModal";

describe("OnComingEventFixedTicketBookingModal", () => {
  beforeEach(() => {
    checkoutMock.mockReset();
    checkoutMock.mockResolvedValue({ ok: true, clientSecret: "cs_ticket" });
  });

  it("returns null when closed", () => {
    const { container } = renderWithProviders(
      <OnComingEventFixedTicketBookingModal
        slug="gala-night"
        eventName="Gala Night"
        price={45}
        open={false}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders ticket booking form when open", () => {
    renderWithProviders(
      <OnComingEventFixedTicketBookingModal
        slug="gala-night"
        eventName="Gala Night"
        price={45}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "BUY TICKET" })).toBeInTheDocument();
    expect(screen.getByText("Gala Night")).toBeInTheDocument();
    expect(screen.getByText("$45.00")).toBeInTheDocument();
  });

  it("omits the price when it is not configured", () => {
    renderWithProviders(
      <OnComingEventFixedTicketBookingModal
        slug="gala-night"
        eventName="Gala Night"
        price={null}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
  });

  it("starts checkout and shows Stripe", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <OnComingEventFixedTicketBookingModal
        slug="gala-night"
        eventName="Gala Night"
        price={45}
        open
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("Phone (optional)"), "555");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(checkoutMock).toHaveBeenCalledWith(
      "gala-night",
      expect.objectContaining({
        customerName: "Ada",
        customerEmail: "ada@example.com",
        customerPhone: "555",
      }),
    );
    expect(await screen.findByTestId("stripe-checkout")).toHaveTextContent(
      "Buy ticket payment",
    );
  });

  it("shows a starting-checkout label while the request is in flight", async () => {
    const user = userEvent.setup();
    let resolveCheckout: (value: unknown) => void = () => undefined;
    checkoutMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCheckout = resolve;
        }),
    );
    renderWithProviders(
      <OnComingEventFixedTicketBookingModal
        slug="gala-night"
        eventName="Gala Night"
        price={45}
        open
        onClose={vi.fn()}
      />,
    );
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(screen.getByRole("button", { name: /starting checkout/i })).toBeDisabled();
    await act(async () => {
      resolveCheckout({ ok: true, clientSecret: "cs_ticket" });
    });
    expect(await screen.findByTestId("stripe-checkout")).toBeInTheDocument();
  });

  it("shows checkout errors, omits empty phone, and closes", async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({ ok: false, message: "Unavailable" });
    const onClose = vi.fn();
    renderWithProviders(
      <OnComingEventFixedTicketBookingModal
        slug="gala-night"
        eventName="Gala Night"
        price={45}
        open
        onClose={onClose}
      />,
    );
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(checkoutMock).toHaveBeenCalledWith(
      "gala-night",
      expect.objectContaining({ customerPhone: undefined }),
    );
    expect(await screen.findByText("Unavailable")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
