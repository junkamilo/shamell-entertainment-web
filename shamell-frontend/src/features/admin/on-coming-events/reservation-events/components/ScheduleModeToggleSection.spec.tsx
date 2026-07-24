/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import {
  RESERVATION_SCHEDULE_MODE_RADIO_NAME,
  ScheduleModeToggleSection,
} from "./ScheduleModeToggleSection";

describe("ScheduleModeToggleSection", () => {
  it("renders title and children", () => {
    renderWithProviders(
      <ScheduleModeToggleSection
        title="FIXED EVENT"
        modeValue="FIXED_EVENT"
        active
        onSelect={vi.fn()}
      >
        <p>Schedule fields</p>
      </ScheduleModeToggleSection>,
    );
    expect(screen.getByText("FIXED EVENT")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Schedule fields")).toBeInTheDocument();
  });

  it("shows description when provided", () => {
    renderWithProviders(
      <ScheduleModeToggleSection
        title="RECURRING"
        description="Weekly class schedule"
        modeValue="RECURRING_WEEKLY"
        active={false}
        onSelect={vi.fn()}
      >
        <p>Recurring fields</p>
      </ScheduleModeToggleSection>,
    );
    expect(screen.getByText("Weekly class schedule")).toBeInTheDocument();
  });

  it("calls onSelect when toggled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <ScheduleModeToggleSection
        title="FIXED EVENT"
        modeValue="FIXED_EVENT"
        active={false}
        onSelect={onSelect}
      >
        <p>Fields</p>
      </ScheduleModeToggleSection>,
    );
    await user.click(screen.getByRole("checkbox", { name: /Activate FIXED EVENT/i }));
    expect(onSelect).toHaveBeenCalled();
    expect(
      screen.getByRole("checkbox", { name: /Activate FIXED EVENT/i }),
    ).toHaveAttribute("name", RESERVATION_SCHEDULE_MODE_RADIO_NAME);
  });
});
