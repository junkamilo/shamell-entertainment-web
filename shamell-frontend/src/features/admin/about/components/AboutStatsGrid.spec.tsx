/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutStatsGrid } from "./AboutStatsGrid";

describe("AboutStatsGrid", () => {
  it("renders all four stat labels and values", () => {
    renderWithProviders(
      <AboutStatsGrid
        stats={{
          state: "Published",
          values: "3",
          media: "Photo",
          updated: "Just now",
        }}
      />,
    );

    expect(screen.getByText("ESTADO")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("VALORES")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("PHOTO / VIDEO")).toBeInTheDocument();
    expect(screen.getByText("Photo")).toBeInTheDocument();
    expect(screen.getByText("LAST UPDATED")).toBeInTheDocument();
    expect(screen.getByText("Just now")).toBeInTheDocument();
  });
});
