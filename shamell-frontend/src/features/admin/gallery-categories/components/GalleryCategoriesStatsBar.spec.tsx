/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import GalleryCategoriesStatsBar from "./GalleryCategoriesStatsBar";

describe("GalleryCategoriesStatsBar", () => {
  it("renders TOTAL, ACTIVE, WITH MEDIA, and SPOTLIGHT labels", () => {
    renderWithProviders(
      <GalleryCategoriesStatsBar
        stats={{
          total: 5,
          active: 3,
          inactive: 2,
          withMedia: 4,
          star: "Weddings",
        }}
      />,
    );

    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("WITH MEDIA")).toBeInTheDocument();
    expect(screen.getByText("SPOTLIGHT")).toBeInTheDocument();
  });

  it("shows the numeric stats and spotlight name", () => {
    renderWithProviders(
      <GalleryCategoriesStatsBar
        stats={{
          total: 5,
          active: 3,
          inactive: 2,
          withMedia: 4,
          star: "Weddings",
        }}
      />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Weddings")).toBeInTheDocument();
  });

  it("renders zero counts and dash spotlight", () => {
    renderWithProviders(
      <GalleryCategoriesStatsBar
        stats={{ total: 0, active: 0, inactive: 0, withMedia: 0, star: "—" }}
      />,
    );

    expect(screen.getAllByText("0")).toHaveLength(3);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
