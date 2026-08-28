/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
  default: () => <div data-testid="instanced-chairs" />,
}));

import PlacedItemsLayer from "./PlacedItemsLayer";

const table: PlacedLayoutItem = {
  id: "t1",
  kind: "catalog_table",
  venueTableConfigId: "cfg",
  tableName: "T1",
  size: "SMALL",
  includedChairs: 2,
  x: 100,
  y: 100,
  rotation: 0,
};

const chair: PlacedLayoutItem = {
  id: "c1",
  kind: "standalone_chair",
  venueStandaloneChairId: "sc",
  chairName: "C1",
  x: 200,
  y: 200,
  rotation: 0,
};

const items: PlacedLayoutItem[] = [table, chair];

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
        itemLabels={new Map([["t1", { short: "T1", full: "Table 1" }]])}
        perfProfile="high"
      />,
    );
    expect(screen.getByTestId("reserved-bubble")).toBeInTheDocument();
    expect(screen.getByTestId("number-bubble")).toBeInTheDocument();
  });

  it("uses instanced chairs and a hit mesh for standalone seats", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        useInstancedChairs
        perfProfile="mobile"
      />,
    );
    expect(screen.getByTestId("instanced-chairs")).toBeInTheDocument();
    expect(screen.queryByTestId("standalone-chair")).not.toBeInTheDocument();
  });

  it("selects items when interactive", () => {
    const onSelect = vi.fn();
    const onReservedSelect = vi.fn();
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        interactive
        reservedIds={new Set(["t1"])}
        onSelect={onSelect}
        onReservedSelect={onReservedSelect}
      />,
    );
    const groups = document.querySelectorAll('[data-r3f="group"]');
    fireEvent.click(groups[0]!);
    expect(onReservedSelect).toHaveBeenCalledWith("t1");
    fireEvent.click(groups[1]!);
    expect(onSelect).toHaveBeenCalledWith("c1");
  });

  it("starts a pointer drag on primary button for unreserved items", () => {
    const onItemPointerDown = vi.fn();
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        interactive
        onItemPointerDown={onItemPointerDown}
      />,
    );
    const group = document.querySelector('[data-r3f="group"]') as HTMLElement;
    fireEvent.pointerDown(group, { button: 2 });
    expect(onItemPointerDown).not.toHaveBeenCalled();
    fireEvent.pointerDown(group, { button: 0 });
    expect(onItemPointerDown).toHaveBeenCalledWith("t1", expect.any(Object));
  });

  it("toggles the pointer cursor", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        pointerCursor
      />,
    );
    const group = document.querySelector('[data-r3f="group"]') as HTMLElement;
    fireEvent.pointerOver(group);
    expect(document.body.style.cursor).toBe("pointer");
    fireEvent.pointerOut(group);
    expect(document.body.style.cursor).toBe("");
  });

  it("marks a selected reserved table as unselected visually", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        selectedId="t1"
        reservedIds={new Set(["t1"])}
      />,
    );
    expect(screen.getByTestId("catalog-table")).toBeInTheDocument();
  });

  it("selects a standalone chair", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        selectedId="c1"
      />,
    );
    expect(screen.getByTestId("standalone-chair")).toBeInTheDocument();
  });

  it("does not use a pointer cursor on reserved items", () => {
    render(
      <PlacedItemsLayer
        items={items}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        pointerCursor
        reservedIds={new Set(["t1"])}
      />,
    );
    const group = document.querySelector('[data-r3f="group"]') as HTMLElement;
    fireEvent.pointerOver(group);
    expect(document.body.style.cursor).not.toBe("pointer");
  });

  it("labels a standalone chair", () => {
    render(
      <PlacedItemsLayer
        items={[chair]}
        viewBoxWidth={1000}
        viewBoxHeight={800}
        itemLabels={new Map([["c1", { short: "C1", full: "Chair 1" }]])}
      />,
    );
    expect(screen.getByTestId("number-bubble")).toBeInTheDocument();
  });
});
