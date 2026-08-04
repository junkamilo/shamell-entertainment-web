/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockClassBookingWizardProps } from "../test/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/stripe/StripeCheckoutHost", () => ({
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
});
