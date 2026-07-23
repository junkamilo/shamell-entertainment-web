/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventsStatsBar from "./EventsStatsBar";

describe("EventsStatsBar", () => {
  it("renders TOTAL EVENTS, ACTIVE, and ITEMS TOTAL labels", () => {
    renderWithProviders(
      <EventsStatsBar
        stats={{ total: 5, activeCount: 3, inactiveCount: 2, itemsTotal: 12 }}
      />,
    );

    expect(screen.getByText("TOTAL EVENTS")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("ITEMS TOTAL")).toBeInTheDocument();
  });

  it("shows the numeric stats values", () => {
    renderWithProviders(
      <EventsStatsBar
        stats={{ total: 5, activeCount: 3, inactiveCount: 2, itemsTotal: 12 }}
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("uses upcoming site labels when variant is upcomingSite", () => {
    renderWithProviders(
      <EventsStatsBar
        stats={{ total: 2, activeCount: 1, inactiveCount: 1, itemsTotal: 4 }}
        variant="upcomingSite"
      />,
    );

    expect(screen.getByText("TOTAL ON COMING")).toBeInTheDocument();
    expect(screen.queryByText("TOTAL EVENTS")).not.toBeInTheDocument();
  });

  it("renders zero counts", () => {
    renderWithProviders(
      <EventsStatsBar
        stats={{ total: 0, activeCount: 0, inactiveCount: 0, itemsTotal: 0 }}
      />,
    );

    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});
