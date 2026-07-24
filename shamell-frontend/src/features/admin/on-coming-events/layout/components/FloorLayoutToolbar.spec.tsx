/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("./FloorLayoutPublishToggle", () => ({
  default: () => <div data-testid="publish-toggle" />,
}));

import FloorLayoutToolbar from "./FloorLayoutToolbar";

describe("FloorLayoutToolbar", () => {
  it("shows chair total and unsaved indicator in edit mode", () => {
    renderWithProviders(
      <FloorLayoutToolbar
        chairTotal={12}
        dirty
        editorMode="edit"
        onEditorModeChange={vi.fn()}
      />,
    );
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/Unsaved/i)).toBeInTheDocument();
    expect(screen.getByTestId("publish-toggle")).toBeInTheDocument();
  });

  it("switches editor mode tabs", async () => {
    const user = userEvent.setup();
    const onEditorModeChange = vi.fn();
    renderWithProviders(
      <FloorLayoutToolbar
        chairTotal={5}
        dirty={false}
        editorMode="edit"
        onEditorModeChange={onEditorModeChange}
      />,
    );
    await user.click(screen.getByRole("tab", { name: /Reserve seats/i }));
    expect(onEditorModeChange).toHaveBeenCalledWith("reserve");
  });
});
