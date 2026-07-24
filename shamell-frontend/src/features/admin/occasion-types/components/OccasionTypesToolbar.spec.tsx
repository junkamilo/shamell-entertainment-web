/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import OccasionTypesToolbar from "./OccasionTypesToolbar";

function renderToolbar(
  overrides: Partial<React.ComponentProps<typeof OccasionTypesToolbar>> = {},
) {
  const props: React.ComponentProps<typeof OccasionTypesToolbar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    filterTab: "all",
    onFilterTabChange: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<OccasionTypesToolbar {...props} />),
    props,
  };
}

describe("OccasionTypesToolbar", () => {
  it("notifies onSearchChange when typing", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();
    await user.type(screen.getByPlaceholderText("Search occasions..."), "birth");
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("notifies onFilterTabChange", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();
    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("active");
  });
});
