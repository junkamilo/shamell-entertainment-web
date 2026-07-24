/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import StandaloneChairPricingFields from "./StandaloneChairPricingFields";

describe("StandaloneChairPricingFields", () => {
  it("renders label and formatted price preview", () => {
    renderWithProviders(
      <StandaloneChairPricingFields unitPriceInput="150" onUnitPriceChange={vi.fn()} />,
    );

    expect(screen.getByText("Unit price (each chair)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("150")).toBeInTheDocument();
    expect(screen.getByText("$150 each")).toBeInTheDocument();
  });

  it("shows validation hint for invalid input", () => {
    renderWithProviders(
      <StandaloneChairPricingFields unitPriceInput="abc" onUnitPriceChange={vi.fn()} />,
    );

    expect(screen.getByText("Enter a valid amount")).toBeInTheDocument();
  });

  it("calls onUnitPriceChange when typing", async () => {
    const user = userEvent.setup();
    const onUnitPriceChange = vi.fn();

    renderWithProviders(
      <StandaloneChairPricingFields unitPriceInput="" onUnitPriceChange={onUnitPriceChange} />,
    );

    await user.type(screen.getByRole("textbox"), "99");
    expect(onUnitPriceChange).toHaveBeenCalled();
  });
});
