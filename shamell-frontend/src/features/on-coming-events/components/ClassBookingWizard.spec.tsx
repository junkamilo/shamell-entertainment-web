/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockClassBookingWizardProps } from "../test/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: () => <div data-testid="stripe-checkout" />,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { ClassBookingWizard } from "./ClassBookingWizard";

describe("ClassBookingWizard", () => {
  it("renders day selection step when open", () => {
    renderWithProviders(
      <ClassBookingWizard {...createMockClassBookingWizardProps()} />,
    );
    expect(screen.getByText("Book a class")).toBeInTheDocument();
    expect(screen.getByText("Choose a day")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /monday/i })).toBeInTheDocument();
  });

  it("does not close when the dimmed backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ClassBookingWizard {...createMockClassBookingWizardProps({ onClose })} />,
    );
    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;
    expect(overlay).toBeTruthy();
    if (overlay) await user.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.getAttribute("data-public-checkout-modal")).toBe("open");
  });
});
