/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeFloorLayoutPalette } from "@test/features/admin/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/admin/on-coming-events/support/helpers/renderWithProviders";
import FloorLayoutPalette from "@/features/admin/on-coming-events/layout/components/FloorLayoutPalette";

describe("FloorLayoutPalette", () => {
  it("renders palette tiles from inventory", () => {
    renderWithProviders(
      <FloorLayoutPalette
        palette={makeFloorLayoutPalette()}
        activePaletteDrag={null}
        onTilePointerDown={vi.fn()}
      />,
    );
    expect(screen.getByText(/Palette/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tap to place Large/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tap to place Chairs/i })).toBeInTheDocument();
  });

  it("shows empty message when inventory is empty", () => {
    renderWithProviders(
      <FloorLayoutPalette
        palette={makeFloorLayoutPalette({
          tablesBySize: { LARGE: 0, MEDIUM: 0, SMALL: 0 },
          standaloneChairsAvailable: 0,
        })}
        activePaletteDrag={null}
        onTilePointerDown={vi.fn()}
      />,
    );
    expect(screen.getByText(/No tables or chairs available/i)).toBeInTheDocument();
  });

  it("forwards pointer down to handler", async () => {
    const user = userEvent.setup();
    const onTilePointerDown = vi.fn();
    renderWithProviders(
      <FloorLayoutPalette
        palette={makeFloorLayoutPalette({ tablesBySize: { LARGE: 1, MEDIUM: 0, SMALL: 0 } })}
        activePaletteDrag={null}
        onTilePointerDown={onTilePointerDown}
      />,
    );
    await user.pointer({
      target: screen.getByRole("button", { name: /Tap to place Large/i }),
      keys: "[MouseLeft>]",
    });
    expect(onTilePointerDown).toHaveBeenCalled();
  });
});
