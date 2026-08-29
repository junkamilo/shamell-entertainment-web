/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeClassSession } from "../test/fixtures/onComingEvents.fixture";
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

vi.mock("../services/createClassCheckoutSession", () => ({
  createClassCheckoutSession: (...args: unknown[]) => checkoutMock(...args),
}));

import { OnComingEventClassBookingModal } from "./OnComingEventClassBookingModal";

describe("OnComingEventClassBookingModal", () => {
  beforeEach(() => {
    checkoutMock.mockReset();
    checkoutMock.mockResolvedValue({ ok: true, clientSecret: "cs_test" });
  });

  it("returns null when closed", () => {
    const { container } = renderWithProviders(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[makeClassSession()]}
        open={false}
        onClose={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders session list when open", () => {
    renderWithProviders(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[makeClassSession()]}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "BOOK A SESSION" })).toBeInTheDocument();
    expect(screen.getByText(/\$25\.00 · 12 spots left/i)).toBeInTheDocument();
  });

  it("shows an empty state and a singular remaining spot", () => {
    const { rerender } = renderWithProviders(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[]}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/no upcoming sessions available/i)).toBeInTheDocument();

    rerender(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[makeClassSession({ seatsRemaining: 1 })]}
        open
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText(/1 spot left/i)).toBeInTheDocument();
  });

  it("disables sold-out sessions and starts checkout for a selected one", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[
          makeClassSession({ id: "sold", seatsRemaining: 0 }),
          makeClassSession({ id: "open", seatsRemaining: 4 }),
        ]}
        open
        onClose={onClose}
      />,
    );

    expect(screen.getByRole("button", { name: /\$25\.00 · 0 spots left/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /\$25\.00 · 4 spots left/i }));
    expect(screen.getByRole("heading", { name: "YOUR DETAILS" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("Phone (optional)"), "555");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));

    expect(checkoutMock).toHaveBeenCalledWith(
      "weekly-bachata",
      expect.objectContaining({
        sessionId: "open",
        customerName: "Ada",
        customerEmail: "ada@example.com",
        customerPhone: "555",
      }),
    );
    expect(await screen.findByTestId("stripe-checkout")).toHaveTextContent(
      "Class booking payment",
    );
  });

  it("shows checkout errors and closes the dialog", async () => {
    const user = userEvent.setup();
    checkoutMock.mockResolvedValue({ ok: false, message: "Sold out" });
    const onClose = vi.fn();
    renderWithProviders(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[makeClassSession()]}
        open
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("button", { name: /12 spots left/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Sold out")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
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
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[makeClassSession()]}
        open
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /12 spots left/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(screen.getByRole("button", { name: /starting checkout/i })).toBeDisabled();
    await act(async () => {
      resolveCheckout({ ok: true, clientSecret: "cs_test" });
    });
    expect(await screen.findByTestId("stripe-checkout")).toBeInTheDocument();
  });

  it("omits empty phone from the checkout body", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <OnComingEventClassBookingModal
        slug="weekly-bachata"
        sessions={[makeClassSession()]}
        open
        onClose={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /12 spots left/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(checkoutMock).toHaveBeenCalledWith(
      "weekly-bachata",
      expect.objectContaining({ customerPhone: undefined }),
    );
  });
});
