/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStandaloneChairItem } from "../test/fixtures/venueTables.fixture";
import { FIXTURE_CHAIR_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import StandaloneChairsMobileCard from "./StandaloneChairsMobileCard";

describe("StandaloneChairsMobileCard", () => {
  it("renders label, price, status, and short id", () => {
    const item = makeStandaloneChairItem();
    renderWithProviders(
      <StandaloneChairsMobileCard item={item} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText(item.displayLabel)).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(
      screen.getByText(
        `$35 each · #${FIXTURE_CHAIR_ID.replace(/-/g, "").slice(0, 6)}`,
      ),
    ).toBeInTheDocument();
  });

  it("calls onEdit and onDelete", async () => {
    const user = userEvent.setup();
    const item = makeStandaloneChairItem();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <StandaloneChairsMobileCard item={item} onEdit={onEdit} onDelete={onDelete} />,
    );

    await user.click(
      screen.getByRole("button", { name: `Edit price for ${item.displayLabel}` }),
    );
    await user.click(
      screen.getByRole("button", { name: `Delete ${item.displayLabel}` }),
    );

    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onDelete).toHaveBeenCalledWith(item);
  });
});
