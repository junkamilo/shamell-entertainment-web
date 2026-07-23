/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventsSearchBar from "./EventsSearchBar";

function renderSearchBar(
  overrides: Partial<React.ComponentProps<typeof EventsSearchBar>> = {},
) {
  const props: React.ComponentProps<typeof EventsSearchBar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    sectionFilter: "ALL",
    onSectionFilterChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventsSearchBar {...props} />), props };
}

describe("EventsSearchBar", () => {
  it("notifies onSearchChange when typing in search", async () => {
    const user = userEvent.setup();
    const { props } = renderSearchBar();

    await user.type(screen.getByPlaceholderText("Search events..."), "wedding");
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("uses upcoming placeholder when upcomingOnly", () => {
    renderSearchBar({ upcomingOnly: true, hideSectionFilter: true });
    expect(
      screen.getByPlaceholderText("Search upcoming events..."),
    ).toBeInTheDocument();
  });

  it("shows section filter select when not hidden", async () => {
    const user = userEvent.setup();
    const { props } = renderSearchBar({ hideSectionFilter: false });

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    await user.selectOptions(select, "GENERAL");
    expect(props.onSectionFilterChange).toHaveBeenCalledWith("GENERAL");
  });

  it("hides section filter when hideSectionFilter is true", () => {
    renderSearchBar({ hideSectionFilter: true });
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
