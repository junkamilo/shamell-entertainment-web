/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./HeaderMediaFocusMedia", () => ({
  default: () => <div data-testid="focus-media" />,
}));

import HeaderMediaFocusEditor from "./HeaderMediaFocusEditor";

function renderEditor(
  overrides: Partial<React.ComponentProps<typeof HeaderMediaFocusEditor>> = {},
) {
  const props: React.ComponentProps<typeof HeaderMediaFocusEditor> = {
    editingFocusPhoto: makeHeaderPhoto(),
    focusDraft: { desktopX: 50, desktopY: 35, mobileX: 50, mobileY: 35 },
    setFocusDraft: vi.fn(),
    focusEditorIsVideo: false,
    isSavingFocus: false,
    onClose: vi.fn(),
    onSetDraftFromPoint: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<HeaderMediaFocusEditor {...props} />), props };
}

describe("HeaderMediaFocusEditor", () => {
  it("renders null when no photo", () => {
    const { container } = renderEditor({ editingFocusPhoto: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title and save control", () => {
    renderEditor();
    expect(screen.getByRole("heading", { name: "Adjust hero focus" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save focal point" })).toBeInTheDocument();
  });

  it("calls onClose and onSave", async () => {
    const user = userEvent.setup();
    const { props } = renderEditor();
    await user.click(screen.getByRole("button", { name: "Close" }));
    await user.click(screen.getByRole("button", { name: "Save focal point" }));
    expect(props.onClose).toHaveBeenCalled();
    expect(props.onSave).toHaveBeenCalled();
  });

  it("updates draft from range inputs", () => {
    const setFocusDraft = vi.fn();
    renderEditor({ setFocusDraft });
    const ranges = screen.getAllByRole("slider");
    fireEvent.change(ranges[0]!, { target: { value: "10" } });
    expect(setFocusDraft).toHaveBeenCalled();
  });
});
