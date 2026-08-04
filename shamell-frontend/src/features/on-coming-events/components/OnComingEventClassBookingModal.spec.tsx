/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeClassSession } from "../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: ({ ariaLabel }: { ariaLabel?: string }) => (
    <div data-testid="stripe-checkout">{ariaLabel}</div>
  ),
}));

import { OnComingEventClassBookingModal } from "./OnComingEventClassBookingModal";

describe("OnComingEventClassBookingModal", () => {
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
});
