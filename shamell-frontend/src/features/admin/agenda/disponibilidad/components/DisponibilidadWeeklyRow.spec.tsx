/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import DisponibilidadWeeklyRow from "./DisponibilidadWeeklyRow";
import type { PublicWeeklySlot } from "@/lib/bookingAvailability";

function makeRow(overrides: Partial<PublicWeeklySlot> = {}): PublicWeeklySlot {
  return { weekday: 1, isClosed: false, startTime: "09:00", endTime: "21:00", ...overrides };
}

describe("DisponibilidadWeeklyRow", () => {
  it("shows the weekday label and a Closed checkbox", () => {
    renderWithProviders(
      <DisponibilidadWeeklyRow row={makeRow()} onClosedChange={vi.fn()} onOpenTimePicker={vi.fn()} />,
    );
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /closed/i })).toBeInTheDocument();
  });

  it("shows formatted US time on the time trigger buttons (09:00 -> 9:00 AM, 21:00 -> 9:00 PM)", () => {
    renderWithProviders(
      <DisponibilidadWeeklyRow
        row={makeRow({ startTime: "09:00", endTime: "21:00" })}
        onClosedChange={vi.fn()}
        onOpenTimePicker={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "9:00 AM" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "9:00 PM" })).toBeInTheDocument();
  });

  it("hides the time buttons when the day is closed", () => {
    renderWithProviders(
      <DisponibilidadWeeklyRow
        row={makeRow({ isClosed: true, startTime: null, endTime: null })}
        onClosedChange={vi.fn()}
        onOpenTimePicker={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /choose time/i })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /closed/i })).toBeChecked();
  });

  it("shows 'Choose time' when a time is null and the day is open", () => {
    renderWithProviders(
      <DisponibilidadWeeklyRow
        row={makeRow({ startTime: null, endTime: null })}
        onClosedChange={vi.fn()}
        onOpenTimePicker={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("button", { name: "Choose time" })).toHaveLength(2);
  });

  it("calls onClosedChange with the weekday and checked state", async () => {
    const user = userEvent.setup();
    const onClosedChange = vi.fn();
    renderWithProviders(
      <DisponibilidadWeeklyRow row={makeRow()} onClosedChange={onClosedChange} onOpenTimePicker={vi.fn()} />,
    );

    await user.click(screen.getByRole("checkbox", { name: /closed/i }));
    expect(onClosedChange).toHaveBeenCalledWith(1, true);
  });

  it("calls onOpenTimePicker with the start/end field when time buttons are clicked", async () => {
    const user = userEvent.setup();
    const onOpenTimePicker = vi.fn();
    renderWithProviders(
      <DisponibilidadWeeklyRow row={makeRow()} onClosedChange={vi.fn()} onOpenTimePicker={onOpenTimePicker} />,
    );

    await user.click(screen.getByRole("button", { name: "9:00 AM" }));
    expect(onOpenTimePicker).toHaveBeenCalledWith({ weekday: 1, field: "start" });

    await user.click(screen.getByRole("button", { name: "9:00 PM" }));
    expect(onOpenTimePicker).toHaveBeenCalledWith({ weekday: 1, field: "end" });
  });
});
