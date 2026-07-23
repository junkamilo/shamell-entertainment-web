/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventTypesStatsBar from "./EventTypesStatsBar";

describe("EventTypesStatsBar", () => {
  it("renders TOTAL, ACTIVE, and INACTIVE labels", () => {
    renderWithProviders(
      <EventTypesStatsBar stats={{ total: 5, active: 3, inactive: 2 }} />,
    );

    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  it("shows the numeric stats values", () => {
    renderWithProviders(
      <EventTypesStatsBar stats={{ total: 5, active: 3, inactive: 2 }} />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders zero counts", () => {
    renderWithProviders(
      <EventTypesStatsBar stats={{ total: 0, active: 0, inactive: 0 }} />,
    );

    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});
