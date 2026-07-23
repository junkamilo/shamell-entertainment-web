/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventTypesToolbar from "./EventTypesToolbar";

function renderToolbar(
  overrides: Partial<React.ComponentProps<typeof EventTypesToolbar>> = {},
) {
  const props: React.ComponentProps<typeof EventTypesToolbar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    filterTab: "all",
    onFilterTabChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventTypesToolbar {...props} />), props };
}

describe("EventTypesToolbar", () => {
  it("notifies onSearchChange when typing in search", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.type(
      screen.getByPlaceholderText("Search event types..."),
      "wedding",
    );
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("switches All / Active / Inactive tabs", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("active");

    await user.click(screen.getByRole("button", { name: "Inactive" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("inactive");

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("all");
  });

  it("highlights the current filter tab", () => {
    renderToolbar({ filterTab: "active" });
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inactive" })).toBeInTheDocument();
  });
});
