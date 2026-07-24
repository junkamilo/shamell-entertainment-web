/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import TableConfigSummary from "./TableConfigSummary";

describe("TableConfigSummary", () => {
  it("renders combo summary for a single table", () => {
    renderWithProviders(
      <TableConfigSummary
        size="LARGE"
        quantity={1}
        includedChairs={8}
        bundlePriceInput="250"
      />,
    );

    expect(screen.getByText("Pricing summary")).toBeInTheDocument();
    expect(
      screen.getByText(/Combo: \$250 — Large table \+ 8 chairs included/),
    ).toBeInTheDocument();
  });

  it("shows bulk quantity hint when creating multiple tables", () => {
    renderWithProviders(
      <TableConfigSummary
        size="MEDIUM"
        quantity={3}
        includedChairs={4}
        bundlePriceInput="180"
      />,
    );

    expect(
      screen.getByText("Same combo pricing for all 3 tables"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/3 × Medium tables \+ 4 chairs included/),
    ).toBeInTheDocument();
  });
});
