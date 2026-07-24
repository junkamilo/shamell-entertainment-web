/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeOccasionTypeItem } from "../test/fixtures/occasionTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import OccasionTypesTable from "./OccasionTypesTable";

function renderTable(
  overrides: Partial<React.ComponentProps<typeof OccasionTypesTable>> = {},
) {
  const item = makeOccasionTypeItem({ isActive: true });
  const props: React.ComponentProps<typeof OccasionTypesTable> = {
    rows: [item],
    togglingId: null,
    cannotDeactivate: () => false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<OccasionTypesTable {...props} />),
    props,
    item,
  };
}

describe("OccasionTypesTable", () => {
  it("renders the occasion type name and Active status", () => {
    const { item } = renderTable();
    expect(screen.getByText(item.name)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls Edit and Delete handlers", async () => {
    const user = userEvent.setup();
    const { props, item } = renderTable();
    await user.click(screen.getByRole("button", { name: `Edit ${item.name}` }));
    expect(props.onEdit).toHaveBeenCalledWith(item);
    await user.click(screen.getByRole("button", { name: `Delete ${item.name}` }));
    expect(props.onDelete).toHaveBeenCalledWith(item);
  });

  it("shows Inactive status for inactive rows", () => {
    const inactive = makeOccasionTypeItem({
      isActive: false,
      name: "Anniversary",
    });
    renderTable({ rows: [inactive] });
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });
});
