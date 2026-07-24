/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeFloorLayout } from "../../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("@/components/venue-3d/PlacedItemsLayer", () => ({
  default: () => <div data-testid="placed-items-layer" />,
}));

vi.mock("../lib/useItemPointerDrag3d", () => ({
  useItemPointerDrag3d: () => ({ onItemPointerDown: vi.fn() }),
}));

import PlacedItemsLayer3d from "./PlacedItemsLayer3d";

describe("PlacedItemsLayer3d", () => {
  it("renders PlacedItemsLayer with drag hook wired", () => {
    const layout = makeFloorLayout();
    renderWithProviders(
      <PlacedItemsLayer3d
        items={layout.items}
        viewBoxWidth={layout.viewBoxWidth}
        viewBoxHeight={layout.viewBoxHeight}
        selectedId={null}
        onSelect={vi.fn()}
        onMoveItem={vi.fn()}
      />,
    );
    expect(screen.getByTestId("placed-items-layer")).toBeInTheDocument();
  });
});
