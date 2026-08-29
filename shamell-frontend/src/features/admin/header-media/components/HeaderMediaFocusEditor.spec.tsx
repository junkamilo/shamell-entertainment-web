/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { createEvent, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import type { FocusDraft } from "../types/headerMedia.types";

vi.mock("./HeaderMediaFocusMedia", () => ({
  default: ({
    url,
    isVideo,
  }: {
    url: string;
    isVideo: boolean;
  }) => (
    <div data-testid="focus-media" data-url={url} data-video={String(isVideo)} />
  ),
}));

import HeaderMediaFocusEditor from "./HeaderMediaFocusEditor";

function previewButtons() {
  return screen
    .getAllByRole("button")
    .filter((el) => el.className.includes("cursor-crosshair"));
}

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

  it("updates draft from all range inputs", () => {
    const prev: FocusDraft = {
      desktopX: 50,
      desktopY: 35,
      mobileX: 50,
      mobileY: 35,
    };
    const results: FocusDraft[] = [];
    const setFocusDraft = vi.fn((updater: (current: FocusDraft) => FocusDraft) => {
      results.push(updater(prev));
    });
    renderEditor({ setFocusDraft });

    const setRange = (name: RegExp, value: string) => {
      fireEvent.change(screen.getByRole("slider", { name }), {
        target: { value },
      });
    };

    setRange(/DESKTOP X/, "10");
    setRange(/DESKTOP Y/, "20");
    setRange(/MOBILE X/, "30");
    setRange(/MOBILE Y/, "40");

    expect(results).toEqual([
      { ...prev, desktopX: 10 },
      { ...prev, desktopY: 20 },
      { ...prev, mobileX: 30 },
      { ...prev, mobileY: 40 },
    ]);
  });

  it("sets draft from desktop and mobile preview clicks", async () => {
    const user = userEvent.setup();
    const { props } = renderEditor();
    const previews = previewButtons();
    expect(previews).toHaveLength(3);

    await user.click(previews[0]!);
    expect(props.onSetDraftFromPoint).toHaveBeenCalledWith(
      expect.any(Object),
      "desktop",
    );
    await user.click(previews[1]!);
    expect(props.onSetDraftFromPoint).toHaveBeenCalledWith(
      expect.any(Object),
      "desktop",
    );
    await user.click(previews[2]!);
    expect(props.onSetDraftFromPoint).toHaveBeenCalledWith(
      expect.any(Object),
      "mobile",
    );
  });

  it("prevents default on Enter and Space in previews", () => {
    renderEditor();
    const preview = previewButtons()[0]!;

    const enter = createEvent.keyDown(preview, { key: "Enter" });
    fireEvent(preview, enter);
    expect(enter.defaultPrevented).toBe(true);

    const space = createEvent.keyDown(preview, { key: " " });
    fireEvent(preview, space);
    expect(space.defaultPrevented).toBe(true);

    const other = createEvent.keyDown(preview, { key: "Escape" });
    fireEvent(preview, other);
    expect(other.defaultPrevented).toBe(false);
  });

  it("closes from Cancel and disables actions while saving video focus", async () => {
    const user = userEvent.setup();
    const photo = makeHeaderPhoto();
    const { props } = renderEditor({
      editingFocusPhoto: photo,
      focusEditorIsVideo: true,
    });

    expect(screen.getAllByTestId("focus-media")[0]).toHaveAttribute(
      "data-video",
      "true",
    );
    expect(screen.getAllByTestId("focus-media")[0]).toHaveAttribute(
      "data-url",
      photo.imageUrl,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("shows a spinner and disables save while saving", () => {
    renderEditor({ isSavingFocus: true });
    expect(screen.getByRole("button", { name: "Save focal point" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });
});
