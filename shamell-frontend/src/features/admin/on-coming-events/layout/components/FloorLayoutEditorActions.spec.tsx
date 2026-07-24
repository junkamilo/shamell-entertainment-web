/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SCENE_STAGE_SELECT_ID } from "@/components/venue-3d/floorSceneZonesDefaults";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import FloorLayoutEditorActions, { sceneSelectionLabel } from "./FloorLayoutEditorActions";

describe("sceneSelectionLabel", () => {
  it("returns Tarima for stage selection", () => {
    expect(sceneSelectionLabel(SCENE_STAGE_SELECT_ID)).toBe("Tarima");
  });

  it("returns null for non-scene selections", () => {
    expect(sceneSelectionLabel("item-1")).toBeNull();
    expect(sceneSelectionLabel(null)).toBeNull();
  });
});

describe("FloorLayoutEditorActions", () => {
  it("renders selection label and action buttons", () => {
    renderWithProviders(
      <FloorLayoutEditorActions
        dirty
        saving={false}
        selectedId={SCENE_STAGE_SELECT_ID}
        selectionLabel={sceneSelectionLabel(SCENE_STAGE_SELECT_ID)}
        onSave={vi.fn()}
        onRotateLeft={vi.fn()}
        onRotateRight={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Tarima")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/i })).toBeEnabled();
  });

  it("disables delete when canDeleteSelected is false", () => {
    renderWithProviders(
      <FloorLayoutEditorActions
        dirty={false}
        saving={false}
        selectedId={SCENE_STAGE_SELECT_ID}
        canDeleteSelected={false}
        onSave={vi.fn()}
        onRotateLeft={vi.fn()}
        onRotateRight={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /Delete/i })).toBeDisabled();
  });

  it("calls handlers when buttons are clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onRotateLeft = vi.fn();
    renderWithProviders(
      <FloorLayoutEditorActions
        dirty
        saving={false}
        selectedId="item-1"
        onSave={onSave}
        onRotateLeft={onRotateLeft}
        onRotateRight={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /-15°|Rotate left/i }));
    await user.click(screen.getByRole("button", { name: /Save/i }));
    expect(onRotateLeft).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalled();
  });
});
