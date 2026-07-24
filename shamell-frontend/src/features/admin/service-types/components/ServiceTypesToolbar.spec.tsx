/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServiceTypesToolbar from "./ServiceTypesToolbar";

function renderToolbar(
  overrides: Partial<React.ComponentProps<typeof ServiceTypesToolbar>> = {},
) {
  const props: React.ComponentProps<typeof ServiceTypesToolbar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    filterTab: "all",
    onFilterTabChange: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<ServiceTypesToolbar {...props} />),
    props,
  };
}

describe("ServiceTypesToolbar", () => {
  it("notifies onSearchChange when typing", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();
    await user.type(
      screen.getByPlaceholderText("Search service type..."),
      "perf",
    );
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("notifies onFilterTabChange", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();
    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("active");
  });
});
