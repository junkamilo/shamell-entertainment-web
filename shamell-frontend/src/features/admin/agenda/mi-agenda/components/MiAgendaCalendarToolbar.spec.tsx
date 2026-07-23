/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import MiAgendaCalendarToolbar from "./MiAgendaCalendarToolbar";

describe("MiAgendaCalendarToolbar", () => {
  it("shows the range text and navigation controls", () => {
    renderWithProviders(
      <MiAgendaCalendarToolbar
        rangeText="Jul 20 – Jul 26, 2026"
        viewMode="week"
        onViewModeChange={vi.fn()}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onToday={vi.fn()}
      />,
    );
    expect(screen.getByText("Jul 20 – Jul 26, 2026")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TODAY" })).toBeInTheDocument();
  });

  it("wires prev/today/next callbacks", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const onToday = vi.fn();
    renderWithProviders(
      <MiAgendaCalendarToolbar
        rangeText="Range"
        viewMode="day"
        onViewModeChange={vi.fn()}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "TODAY" }));
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPrev).toHaveBeenCalledOnce();
    expect(onToday).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it("switches view modes", async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();
    renderWithProviders(
      <MiAgendaCalendarToolbar
        rangeText="Range"
        viewMode="week"
        onViewModeChange={onViewModeChange}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onToday={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "DAY" }));
    await user.click(screen.getByRole("button", { name: "MONTH" }));
    expect(onViewModeChange).toHaveBeenCalledWith("day");
    expect(onViewModeChange).toHaveBeenCalledWith("month");
  });
});
