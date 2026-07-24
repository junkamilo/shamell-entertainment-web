/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import GalleryToolbar from "./GalleryToolbar";

function renderToolbar(
  overrides: Partial<React.ComponentProps<typeof GalleryToolbar>> = {},
) {
  const props: React.ComponentProps<typeof GalleryToolbar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<GalleryToolbar {...props} />), props };
}

describe("GalleryToolbar", () => {
  it("notifies onSearchChange when typing in search", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.type(
      screen.getByPlaceholderText("Search by category name..."),
      "weddings",
    );
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("shows the current search query value", () => {
    renderToolbar({ searchQuery: "corporate" });
    expect(screen.getByDisplayValue("corporate")).toBeInTheDocument();
  });
});
