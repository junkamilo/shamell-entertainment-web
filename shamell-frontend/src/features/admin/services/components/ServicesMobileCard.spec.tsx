/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminService } from "../test/fixtures/services.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesMobileCard from "./ServicesMobileCard";

function renderCard(
  overrides: Partial<React.ComponentProps<typeof ServicesMobileCard>> = {},
) {
  const service = makeAdminService({ isActive: true });
  const props: React.ComponentProps<typeof ServicesMobileCard> = {
    service,
    togglingId: null,
    deactivateBlocked: false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggle: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<ServicesMobileCard {...props} />),
    props,
    service,
  };
}

describe("ServicesMobileCard", () => {
  it("renders service heading bits and Activo status", () => {
    const { service } = renderCard();
    expect(screen.getByText(service.description)).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.getByText(service.serviceTypeName)).toBeInTheDocument();
  });

  it("calls View / Edit / Delete callbacks", async () => {
    const user = userEvent.setup();
    const { props } = renderCard();

    await user.click(screen.getByRole("button", { name: "View service" }));
    expect(props.onView).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Edit service" }));
    expect(props.onEdit).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole("button", { name: "Delete service permanently" }),
    );
    expect(props.onDelete).toHaveBeenCalledOnce();
  });
});
