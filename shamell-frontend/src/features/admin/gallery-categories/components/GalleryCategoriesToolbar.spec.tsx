/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import GalleryCategoriesToolbar from "./GalleryCategoriesToolbar";

function renderToolbar(
  overrides: Partial<React.ComponentProps<typeof GalleryCategoriesToolbar>> = {},
) {
  const props: React.ComponentProps<typeof GalleryCategoriesToolbar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    filterTab: "all",
    onFilterTabChange: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<GalleryCategoriesToolbar {...props} />),
    props,
  };
}

describe("GalleryCategoriesToolbar", () => {
  it("notifies onSearchChange when typing in search", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.type(
      screen.getByPlaceholderText("Search by name or slug..."),
      "weddings",
    );
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("notifies onFilterTabChange for Active and Inactive", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("active");

    await user.click(screen.getByRole("button", { name: "Inactive" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("inactive");
  });

  it("shows the current search query value", () => {
    renderToolbar({ searchQuery: "corporate" });
    expect(screen.getByDisplayValue("corporate")).toBeInTheDocument();
  });
});
