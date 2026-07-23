/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesStatsBar from "./ServicesStatsBar";

describe("ServicesStatsBar", () => {
  it("renders TOTAL SERVICES, ACTIVE, and TOTAL ITEMS", () => {
    renderWithProviders(
      <ServicesStatsBar stats={{ total: 5, active: 3, inactive: 2, itemsTotal: 12 }} />,
    );

    expect(screen.getByText("TOTAL SERVICES")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("TOTAL ITEMS")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
