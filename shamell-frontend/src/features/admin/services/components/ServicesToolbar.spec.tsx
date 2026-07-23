/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeServiceType } from "../test/fixtures/services.fixture";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesToolbar from "./ServicesToolbar";

function renderToolbar(
  overrides: Partial<React.ComponentProps<typeof ServicesToolbar>> = {},
) {
  const props: React.ComponentProps<typeof ServicesToolbar> = {
    searchQuery: "",
    onSearchChange: vi.fn(),
    filterTab: "all",
    onFilterTabChange: vi.fn(),
    tabCounts: { all: 2, active: 1, inactive: 1 },
    filtersOpen: false,
    onFiltersOpenChange: vi.fn(),
    typeFilterId: null,
    onTypeFilterChange: vi.fn(),
    serviceTypes: [
      makeServiceType(),
      makeServiceType({
        id: "t2222222-2222-4222-8222-222222222222",
        name: "Private class",
      }),
    ],
    ...overrides,
  };
  return { ...renderWithProviders(<ServicesToolbar {...props} />), props };
}

describe("ServicesToolbar", () => {
  it("notifies onSearchChange when typing in search", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.type(
      screen.getByPlaceholderText("Search services..."),
      "dance",
    );
    expect(props.onSearchChange).toHaveBeenCalled();
  });

  it("switches All / Active / Inactive tabs", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar();

    await user.click(screen.getByRole("button", { name: /^Active\s*•/ }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("active");

    await user.click(screen.getByRole("button", { name: /^Inactive\s*•/ }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("inactive");

    await user.click(screen.getByRole("button", { name: /^All\s*•/ }));
    expect(props.onFilterTabChange).toHaveBeenCalledWith("all");
  });

  it("toggles Filters open", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar({ filtersOpen: false });

    await user.click(screen.getByRole("button", { name: /Filters/i }));
    expect(props.onFiltersOpenChange).toHaveBeenCalledWith(true);
  });

  it("filters by service type chips when Filters is open", async () => {
    const user = userEvent.setup();
    const { props } = renderToolbar({ filtersOpen: true });

    expect(screen.getByText("SERVICE TYPE")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Performance" }));
    expect(props.onTypeFilterChange).toHaveBeenCalledWith(FIXTURE_SERVICE_TYPE_ID);

    await user.click(screen.getByRole("button", { name: "All types" }));
    expect(props.onTypeFilterChange).toHaveBeenCalledWith(null);
  });
});
