/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import InquirySelectionSummary from "./InquirySelectionSummary";

describe("InquirySelectionSummary", () => {
  it("shows pricing preview and event line", () => {
    renderWithProviders(
      <InquirySelectionSummary
        eventLine={{ name: "Gala Night", price: 2500 }}
        occasionLines={[{ name: "Wedding" }]}
        serviceLines={[{ name: "Performance", price: 1500 }]}
        guideInvestment={{ totalUsd: 4000, isPartial: false }}
      />,
    );
    expect(screen.getByText("Pricing preview")).toBeInTheDocument();
    expect(screen.getByText("Gala Night")).toBeInTheDocument();
    expect(screen.getByText("Wedding")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
  });

  it("shows empty placeholders when nothing is selected", () => {
    renderWithProviders(
      <InquirySelectionSummary
        eventLine={null}
        occasionLines={[]}
        serviceLines={[]}
      />,
    );
    expect(
      screen.getByText(/select a catalog offering to see its guide price/i),
    ).toBeInTheDocument();
  });
});
