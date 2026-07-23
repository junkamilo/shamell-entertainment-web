/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminService } from "../test/fixtures/services.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesTable from "./ServicesTable";

function renderTable(
  overrides: Partial<React.ComponentProps<typeof ServicesTable>> = {},
) {
  const service = makeAdminService({
    description: "Private show package with dancers and staging.",
    isActive: true,
  });
  const props: React.ComponentProps<typeof ServicesTable> = {
    services: [service],
    togglingId: null,
    cannotDeactivate: () => false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggle: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<ServicesTable {...props} />),
    props,
    service,
  };
}

describe("ServicesTable", () => {
  it("renders service description heading and Activo status", () => {
    renderTable();
    expect(
      screen.getByText("Private show package with dancers and staging."),
    ).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("calls View / Edit / Delete handlers from aria buttons", async () => {
    const user = userEvent.setup();
    const { props, service } = renderTable();

    await user.click(screen.getByRole("button", { name: "View service" }));
    expect(props.onView).toHaveBeenCalledWith(service);

    await user.click(screen.getByRole("button", { name: "Edit service" }));
    expect(props.onEdit).toHaveBeenCalledWith(service);

    await user.click(
      screen.getByRole("button", { name: "Delete service permanently" }),
    );
    expect(props.onDelete).toHaveBeenCalledWith(service);
  });
});
