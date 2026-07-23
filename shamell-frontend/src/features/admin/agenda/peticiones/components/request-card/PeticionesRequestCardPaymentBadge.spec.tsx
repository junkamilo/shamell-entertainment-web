/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import PeticionesRequestCardPaymentBadge from "./PeticionesRequestCardPaymentBadge";

describe("PeticionesRequestCardPaymentBadge", () => {
  it("renders booking payment badge labels", () => {
    const { rerender } = renderWithProviders(
      <PeticionesRequestCardPaymentBadge
        bookingPaymentVisual="paid_full"
        isReserved={false}
        isCancelled={false}
      />,
    );
    expect(screen.getByText("PAID")).toBeInTheDocument();

    rerender(
      <PeticionesRequestCardPaymentBadge
        bookingPaymentVisual="deposit_partial"
        isReserved={false}
        isCancelled={false}
      />,
    );
    expect(screen.getByText("DEPOSIT PAID")).toBeInTheDocument();
  });

  it("falls back to reserved / canceled / new for contacts", () => {
    const { rerender } = renderWithProviders(
      <PeticionesRequestCardPaymentBadge
        bookingPaymentVisual={null}
        isReserved
        isCancelled={false}
      />,
    );
    expect(screen.getByText("RESERVED")).toBeInTheDocument();

    rerender(
      <PeticionesRequestCardPaymentBadge
        bookingPaymentVisual={null}
        isReserved={false}
        isCancelled
      />,
    );
    expect(screen.getByText("CANCELED")).toBeInTheDocument();

    rerender(
      <PeticionesRequestCardPaymentBadge
        bookingPaymentVisual={null}
        isReserved={false}
        isCancelled={false}
      />,
    );
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });
});
