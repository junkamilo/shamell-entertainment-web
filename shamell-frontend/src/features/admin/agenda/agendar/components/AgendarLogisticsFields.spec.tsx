/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { AgendarLogisticsFields } from "./AgendarLogisticsFields";

describe("AgendarLogisticsFields", () => {
  it("opens date and time pickers on desktop", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState();
    render(<AgendarLogisticsFields form={form} variant="desktop" />);

    expect(screen.getByText(/event date & time/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /choose date/i }));
    expect(form.setDatePickerOpen).toHaveBeenCalledWith(true);

    const timeButtons = screen.getAllByRole("button", { name: /choose time/i });
    await user.click(timeButtons[0]!);
    expect(form.setTimePickerWhich).toHaveBeenCalledWith("start");
    await user.click(timeButtons[1]!);
    expect(form.setTimePickerWhich).toHaveBeenCalledWith("end");
  });

  it("uses compact labels on mobile", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState({
      eventDateIso: "2026-07-01",
      eventTimeStart: "18:00",
      eventTimeEnd: "20:00",
    });
    render(<AgendarLogisticsFields form={form} variant="mobile" />);

    expect(screen.getByText(/^date$/i)).toBeInTheDocument();
    expect(screen.getByText(/^start$/i)).toBeInTheDocument();
    expect(screen.getByText(/^end$/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /calendar/i }));
    expect(form.setDatePickerOpen).toHaveBeenCalledWith(true);
  });
});
