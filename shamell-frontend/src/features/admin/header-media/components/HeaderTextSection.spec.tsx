/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_HEADER_TEXT } from "@/lib/headerTextTypes";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./HeaderTextPreview", () => ({
  default: () => <div data-testid="text-preview" />,
}));

vi.mock("./HeaderTextEditModal", () => ({
  default: () => <div data-testid="edit-modal" />,
}));

import HeaderTextSection from "./HeaderTextSection";

function makeState(overrides: Record<string, unknown> = {}) {
  return {
    previewContent: DEFAULT_HEADER_TEXT,
    isLoading: false,
    openEditModal: vi.fn(),
    isModalOpen: false,
    closeEditModal: vi.fn(),
    handleSubmit: vi.fn(),
    form: {},
    record: null,
    reload: vi.fn(),
    ...overrides,
  };
}

describe("HeaderTextSection", () => {
  it("renders preview heading and Edit text", () => {
    renderWithProviders(<HeaderTextSection state={makeState() as never} />);
    expect(
      screen.getByRole("heading", { name: "Hero text preview" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("text-preview")).toBeInTheDocument();
    expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
  });

  it("shows Loading and calls openEditModal", async () => {
    const user = userEvent.setup();
    const state = makeState({ isLoading: true });
    renderWithProviders(<HeaderTextSection state={state as never} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit text" }));
    expect(state.openEditModal).toHaveBeenCalled();
  });
});
