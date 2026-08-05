/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import VenueSceneLegend from "./VenueSceneLegend";

const paletteBase = {
  unplacedTables: [],
  unplacedChairs: [],
  placedTableIds: [] as string[],
  placedChairIds: [] as string[],
  placedChairCount: 0,
};

describe("VenueSceneLegend", () => {
  it("renders table size labels from palette", () => {
    render(
      <VenueSceneLegend
        palette={{
          ...paletteBase,
          tablesBySize: { LARGE: 2, MEDIUM: 1, SMALL: 0 },
          standaloneChairsAvailable: 3,
        }}
      />,
    );
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText(/2 available/)).toBeInTheDocument();
  });

  it("applies narrow top layout class", () => {
    const { container } = render(
      <VenueSceneLegend layoutTopOnNarrow showReservationKey />,
    );
    expect(container.firstChild).toHaveClass("top-2");
  });

  it("shows reservation key when enabled", () => {
    render(<VenueSceneLegend showReservationKey />);
    expect(screen.getByText(/Sold \(paid\)/)).toBeInTheDocument();
  });
});
