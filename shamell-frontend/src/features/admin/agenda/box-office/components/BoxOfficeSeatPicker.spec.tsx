/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeChairSeat, makeTableSeat } from "../test/fixtures/boxOffice.fixture";
import {
  FIXTURE_LAYOUT_CHAIR_ID,
  FIXTURE_LAYOUT_TABLE_ID,
} from "../test/fixtures/uuids.fixture";
import { BoxOfficeSeatPicker } from "./BoxOfficeSeatPicker";

describe("BoxOfficeSeatPicker", () => {
  it("shows a loading message while seats are loading", () => {
    renderWithProviders(
      <BoxOfficeSeatPicker
        seats={[]}
        selectedSeatId={null}
        onSelect={vi.fn()}
        loading
      />,
    );
    expect(
      screen.getByText(/loading tables and chairs/i),
    ).toBeInTheDocument();
  });

  it("shows an empty message when there are no seats at all", () => {
    renderWithProviders(
      <BoxOfficeSeatPicker
        seats={[]}
        selectedSeatId={null}
        onSelect={vi.fn()}
        loading={false}
      />,
    );
    expect(
      screen.getByText(/no tables or chairs on the floor layout/i),
    ).toBeInTheDocument();
  });

  it("selects a table seat", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <BoxOfficeSeatPicker
        seats={[makeTableSeat()]}
        selectedSeatId={null}
        onSelect={onSelect}
        loading={false}
      />,
    );

    await user.click(screen.getByText("Large 1"));
    expect(onSelect).toHaveBeenCalledWith(FIXTURE_LAYOUT_TABLE_ID);
  });

  it("filters to chairs when the CHAIRS pill is selected", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <BoxOfficeSeatPicker
        seats={[makeTableSeat(), makeChairSeat()]}
        selectedSeatId={null}
        onSelect={onSelect}
        loading={false}
      />,
    );

    expect(screen.getByText("Large 1")).toBeInTheDocument();
    expect(screen.queryByText("Chair 12")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "CHAIRS" }));

    expect(screen.getByText("Chair 12")).toBeInTheDocument();
    expect(screen.queryByText("Large 1")).not.toBeInTheDocument();

    await user.click(screen.getByText("Chair 12"));
    expect(onSelect).toHaveBeenCalledWith(FIXTURE_LAYOUT_CHAIR_ID);
  });

  it("disables and labels a reserved seat", () => {
    renderWithProviders(
      <BoxOfficeSeatPicker
        seats={[makeTableSeat({ reserved: true })]}
        selectedSeatId={null}
        onSelect={vi.fn()}
        loading={false}
      />,
    );

    expect(screen.getByText("RESERVED")).toBeInTheDocument();
    expect(screen.getByText("Large 1").closest("button")).toBeDisabled();
  });

  it("disables and labels a pending seat", () => {
    renderWithProviders(
      <BoxOfficeSeatPicker
        seats={[makeTableSeat({ pending: true })]}
        selectedSeatId={null}
        onSelect={vi.fn()}
        loading={false}
      />,
    );

    expect(screen.getByText("PENDING")).toBeInTheDocument();
    expect(screen.getByText("Large 1").closest("button")).toBeDisabled();
  });
});
