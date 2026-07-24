/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";
import { FIXTURE_TABLE_ID_2 } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./VenueTablesMobileCard", () => ({
  default: () => <div data-testid="venue-tables-mobile-card" />,
}));

vi.mock("./VenueTablesTable", () => ({
  default: () => <div data-testid="venue-tables-table" />,
}));

import VenueTablesList from "./VenueTablesList";

function renderList(
  overrides: Partial<React.ComponentProps<typeof VenueTablesList>> = {},
) {
  const table = makeVenueTable();
  const table2 = makeVenueTable({
    id: FIXTURE_TABLE_ID_2,
    tableName: "Medium 1",
    displayLabel: "Medium 1",
    size: "MEDIUM",
    includedChairs: 6,
    bundlePrice: 180,
  });
  const activeItems = [table, table2];
  const props: React.ComponentProps<typeof VenueTablesList> = {
    sizeFilter: "ALL",
    activeItems,
    viewItems: activeItems,
    visibleItems: activeItems,
    onEdit: vi.fn(),
    onDeactivate: vi.fn(),
    onDeleteAll: vi.fn(),
    onDeleteSize: vi.fn(),
    onBulkEditPrices: vi.fn(),
    bulkEditDisabled: true,
    deletingScope: null,
    ...overrides,
  };
  return { ...renderWithProviders(<VenueTablesList {...props} />), props, table, table2 };
}

describe("VenueTablesList", () => {
  it("renders summary metrics for all tables", () => {
    renderList();
    expect(screen.getByRole("heading", { name: "All tables" })).toBeInTheDocument();
    expect(screen.getByText("ALL")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("14")).toBeInTheDocument();
  });

  it("disables bulk edit when bulkEditDisabled is true", () => {
    renderList({ bulkEditDisabled: true });
    expect(screen.getByRole("button", { name: "Edit all prices" })).toBeDisabled();
  });

  it("calls onDeleteAll from delete button in ALL view", async () => {
    const user = userEvent.setup();
    const { props } = renderList();
    await user.click(screen.getByRole("button", { name: "Delete all" }));
    expect(props.onDeleteAll).toHaveBeenCalled();
  });

  it("shows size-specific title and delete label when filtered", () => {
    const table2 = makeVenueTable({
      id: FIXTURE_TABLE_ID_2,
      tableName: "Medium 1",
      displayLabel: "Medium 1",
      size: "MEDIUM",
      includedChairs: 6,
      bundlePrice: 180,
    });
    renderList({
      sizeFilter: "MEDIUM",
      viewItems: [table2],
      visibleItems: [table2],
    });
    expect(screen.getByRole("heading", { name: "Medium tables" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete Medium" })).toBeInTheDocument();
  });
});
