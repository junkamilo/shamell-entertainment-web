/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeStandaloneChairItem } from "../test/fixtures/venueTables.fixture";
import { FIXTURE_CHAIR_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import StandaloneChairsTable from "./StandaloneChairsTable";

describe("StandaloneChairsTable", () => {
  it("renders chair rows with status, price, and internal id", () => {
    const chair = makeStandaloneChairItem();
    renderWithProviders(
      <StandaloneChairsTable
        chairs={[chair]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("CHAIR")).toBeInTheDocument();
    expect(screen.getByText(chair.displayLabel)).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("$35 each")).toBeInTheDocument();
    expect(
      screen.getByText(`#${FIXTURE_CHAIR_ID.replace(/-/g, "").slice(0, 6)}`),
    ).toBeInTheDocument();
  });

  it("shows Reserved status for reserved chairs", () => {
    renderWithProviders(
      <StandaloneChairsTable
        chairs={[makeStandaloneChairItem({ isReserved: true })]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Reserved")).toBeInTheDocument();
  });

  it("calls onEdit and onDelete from row actions", async () => {
    const user = userEvent.setup();
    const chair = makeStandaloneChairItem();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    renderWithProviders(
      <StandaloneChairsTable chairs={[chair]} onEdit={onEdit} onDelete={onDelete} />,
    );

    await user.click(
      screen.getByRole("button", { name: `Edit price for ${chair.displayLabel}` }),
    );
    await user.click(
      screen.getByRole("button", { name: `Delete ${chair.displayLabel}` }),
    );

    expect(onEdit).toHaveBeenCalledWith(chair);
    expect(onDelete).toHaveBeenCalledWith(chair);
  });
});
