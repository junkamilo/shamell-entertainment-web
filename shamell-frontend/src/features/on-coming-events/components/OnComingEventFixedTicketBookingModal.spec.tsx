/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div data-testid="stripe-checkout">{ariaLabel}</div>
  ),
}));

import { OnComingEventFixedTicketBookingModal } from "./OnComingEventFixedTicketBookingModal";

describe("OnComingEventFixedTicketBookingModal", () => {
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
    expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();
  });
});
