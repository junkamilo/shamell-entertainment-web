/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import GalleryStatsBar from "./GalleryStatsBar";

describe("GalleryStatsBar", () => {
  it("renders TOTAL MEDIOS, VISIBLES, and ALBUMS IN USE labels", () => {
    renderWithProviders(
      <GalleryStatsBar stats={{ total: 5, visible: 3, catsWith: 2 }} />,
    );

    expect(screen.getByText("TOTAL MEDIOS")).toBeInTheDocument();
    expect(screen.getByText("VISIBLES")).toBeInTheDocument();
    expect(screen.getByText("ALBUMS IN USE")).toBeInTheDocument();
  });

  it("shows the numeric stats values", () => {
    renderWithProviders(
      <GalleryStatsBar stats={{ total: 5, visible: 3, catsWith: 2 }} />,
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders zero counts", () => {
    renderWithProviders(
      <GalleryStatsBar stats={{ total: 0, visible: 0, catsWith: 0 }} />,
    );

    expect(screen.getAllByText("0")).toHaveLength(3);
  });
});
