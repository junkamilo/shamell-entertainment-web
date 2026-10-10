/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeFloorLayout } from "@test/features/admin/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/admin/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/components/venue-3d", () => ({
  PlacedItemsLayer: () => <div data-testid="placed-items-layer" />,
}));

vi.mock("@/features/admin/on-coming-events/layout/lib/useItemPointerDrag3d", () => ({
  useItemPointerDrag3d: () => ({ onItemPointerDown: vi.fn() }),
}));

import PlacedItemsLayer3d from "@/features/admin/on-coming-events/layout/components/PlacedItemsLayer3d";

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
