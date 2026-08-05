/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PlacedLayoutItem } from "@/components/floor-layout";

vi.mock("@react-three/fiber", () => ({
  useFrame: () => {},
}));

vi.mock("../CatalogTableMesh", () => ({
  default: () => <div data-testid="catalog-table" />,
}));

vi.mock("../StandaloneChairMesh", () => ({
  default: () => <div data-testid="standalone-chair" />,
}));

vi.mock("../ReservationSpeechBubble", () => ({
  default: () => <div data-testid="reserved-bubble" />,
}));

vi.mock("../VenueItemNumberBubble", () => ({
  default: () => <div data-testid="number-bubble" />,
}));

vi.mock("../../chair/InstancedBanquetChairs", () => ({
  default: () => null,
}));

import PlacedItemsLayer from "./PlacedItemsLayer";

const items: PlacedLayoutItem[] = [
  {
    id: "t1",
    kind: "catalog_table",
    venueTableConfigId: "cfg",
    tableName: "T1",
    size: "SMALL",
    includedChairs: 2,
    x: 100,
    y: 100,
    rotation: 0,
  },
  {
    id: "c1",
    kind: "standalone_chair",
    venueStandaloneChairId: "sc",
    chairName: "C1",
    x: 200,
    y: 200,
    rotation: 0,
  },
];

describe("PlacedItemsLayer", () => {
  it("renders meshes for each item", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        perfProfile="high"
      />,
    );
    expect(screen.getByTestId("catalog-table")).toBeInTheDocument();
    expect(screen.getByTestId("standalone-chair")).toBeInTheDocument();
  });

  it("shows reserved bubble when item is reserved", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        reservedIds={new Set(["t1"])}
        itemLabels={
          new Map([["t1", { short: "T1", full: "Table 1" }]])
        }
        perfProfile="high"
      />,
    );
    expect(screen.getByTestId("reserved-bubble")).toBeInTheDocument();
  });
});
