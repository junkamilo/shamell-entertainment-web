/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEventTypeItem } from "../test/fixtures/eventTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import EventTypesTable from "./EventTypesTable";

function renderTable(
  overrides: Partial<React.ComponentProps<typeof EventTypesTable>> = {},
) {
  const item = makeEventTypeItem({ isActive: true });
  const props: React.ComponentProps<typeof EventTypesTable> = {
    types: [item],
    togglingId: null,
    cannotDeactivate: () => false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<EventTypesTable {...props} />),
    props,
    item,
  };
}

describe("EventTypesTable", () => {
  it("renders the event type name and Active status", () => {
    const { item } = renderTable();
    expect(screen.getByText(item.name)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("calls Edit and Delete handlers from aria buttons", async () => {
    const user = userEvent.setup();
    const { props, item } = renderTable();

    await user.click(screen.getByRole("button", { name: `Edit ${item.name}` }));
    expect(props.onEdit).toHaveBeenCalledWith(item);

    await user.click(screen.getByRole("button", { name: `Delete ${item.name}` }));
    expect(props.onDelete).toHaveBeenCalledWith(item);
  });

  it("shows Inactive status for inactive rows", () => {
    const inactive = makeEventTypeItem({ isActive: false, name: "Corporate gala" });
    renderTable({ types: [inactive] });
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });
});
