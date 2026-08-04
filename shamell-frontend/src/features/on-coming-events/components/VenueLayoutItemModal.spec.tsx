/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createVenueLayoutItemModalProps } from "../test/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/stripe/StripeCheckoutHost", () => ({
  StripeCheckoutHost: () => <div data-testid="stripe-checkout" />,
}));

import VenueLayoutItemModal from "./VenueLayoutItemModal";

describe("VenueLayoutItemModal", () => {
  it("renders table summary and reserve action", async () => {
    const props = createVenueLayoutItemModalProps();
    renderWithProviders(<VenueLayoutItemModal {...props} />);
    expect(screen.getByRole("heading", { name: "Large" })).toBeInTheDocument();
    expect(screen.getByText("Saturday Gala")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /reserve/i }));
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it("shows reserved message when seat is taken", () => {
    const props = createVenueLayoutItemModalProps({ isReserved: true });
    renderWithProviders(<VenueLayoutItemModal {...props} />);
    expect(
      screen.getByText(/this seat is already reserved for the event/i),
    ).toBeInTheDocument();
  });
});
