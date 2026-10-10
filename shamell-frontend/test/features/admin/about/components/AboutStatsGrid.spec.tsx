/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/about/support/helpers/renderWithProviders";
import { AboutStatsGrid } from "@/features/admin/about/components/AboutStatsGrid";

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
