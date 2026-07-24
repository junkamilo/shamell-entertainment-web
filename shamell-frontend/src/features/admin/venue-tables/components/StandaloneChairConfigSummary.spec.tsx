/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import StandaloneChairConfigSummary from "./StandaloneChairConfigSummary";

describe("StandaloneChairConfigSummary", () => {
  it("shows add quantity, unit price, and new inventory total", () => {
    renderWithProviders(
      <StandaloneChairConfigSummary
        addQuantity={3}
        currentCount={5}
        unitPriceInput="42"
      />,
    );

    expect(screen.getByText("Summary")).toBeInTheDocument();
    expect(screen.getByText("Chairs to add")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("$42 each")).toBeInTheDocument();
    expect(screen.getByText("New inventory total")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("shows em dash when unit price is invalid", () => {
    renderWithProviders(
      <StandaloneChairConfigSummary
        addQuantity={1}
        currentCount={0}
        unitPriceInput=""
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.getByText(/Lists show "Chair" only\./),
    ).toBeInTheDocument();
  });
});
