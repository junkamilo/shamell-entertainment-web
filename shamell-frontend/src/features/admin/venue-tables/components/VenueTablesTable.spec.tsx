/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import VenueTablesTable from "./VenueTablesTable";

function renderTable(
  overrides: Partial<React.ComponentProps<typeof VenueTablesTable>> = {},
) {
  const item = makeVenueTable();
  const props: React.ComponentProps<typeof VenueTablesTable> = {
    items: [item],
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<VenueTablesTable {...props} />), props, item };
}

describe("VenueTablesTable", () => {
  it("renders table name, size, chairs, and combo price", () => {
    const { item } = renderTable();
    expect(screen.getByText(item.displayLabel!)).toBeInTheDocument();
    expect(screen.getByText("Large")).toBeInTheDocument();
    expect(screen.getByText(String(item.includedChairs))).toBeInTheDocument();
    expect(screen.getByText("$250")).toBeInTheDocument();
  });

  it("calls onEdit and onDeactivate from row actions", async () => {
    const user = userEvent.setup();
    const { props, item } = renderTable();
    await user.click(
      screen.getByRole("button", { name: `Edit ${item.displayLabel}` }),
    );
    await user.click(
      screen.getByRole("button", { name: `Deactivate ${item.displayLabel}` }),
    );
    expect(props.onEdit).toHaveBeenCalledWith(item);
    expect(props.onDeactivate).toHaveBeenCalledWith(item);
  });
});
