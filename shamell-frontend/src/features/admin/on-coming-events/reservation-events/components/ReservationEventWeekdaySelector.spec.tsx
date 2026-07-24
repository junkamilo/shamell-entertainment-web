/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { defaultReservationWeekdays } from "../lib/reservationEventTemplateDefaults";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { ReservationEventWeekdaySelector } from "./ReservationEventWeekdaySelector";

describe("ReservationEventWeekdaySelector", () => {
  it("renders weekday toggle buttons", () => {
    renderWithProviders(
      <ReservationEventWeekdaySelector
        weekdays={defaultReservationWeekdays()}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "SUN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "MON" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "SAT" })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles weekday on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ReservationEventWeekdaySelector
        weekdays={defaultReservationWeekdays()}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "SAT" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ weekday: 6, isActive: true }),
      ]),
    );
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ReservationEventWeekdaySelector
        weekdays={defaultReservationWeekdays()}
        disabled
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("button", { name: "SAT" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
