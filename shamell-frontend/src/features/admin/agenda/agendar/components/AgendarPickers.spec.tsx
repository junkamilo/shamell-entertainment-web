/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import type { AgendarAvailability } from "../types/agendarAvailability.types";
import { AgendarPickers } from "./AgendarPickers";

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: ({
    isOpen,
    title,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onConfirm: (iso: string) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>
          close-date
        </button>
        <button type="button" onClick={() => onConfirm("2030-01-15")}>
          confirm-date
        </button>
      </div>
    ) : null,
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({
    isOpen,
    title,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onConfirm: (hhmm: string) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button type="button" onClick={onClose}>
          close-time
        </button>
        <button type="button" onClick={() => onConfirm("19:00")}>
          confirm-time
        </button>
      </div>
    ) : null,
}));

const availability = {
  bookingTz: "America/New_York",
  blockedIsoDates: new Set<string>(),
  blockedReasonByIso: new Map<string, string>(),
  startTimeClamp: undefined,
  minSelectableIso: "2026-07-01",
} as AgendarAvailability;

describe("AgendarPickers", () => {
  it("shows the date picker when open and wires confirm/close", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState({ datePickerOpen: true });
    render(
      <AgendarPickers
        form={form}
        availability={availability}
        occupiedRanges={[]}
        isMobileLayout={false}
      />,
    );
    expect(screen.getByRole("dialog", { name: /event date/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-date" }));
    expect(form.setEventDateIso).toHaveBeenCalledWith("2030-01-15");
    await user.click(screen.getByRole("button", { name: "close-date" }));
    expect(form.setDatePickerOpen).toHaveBeenCalledWith(false);
  });

  it("shows the start time picker", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState({ timePickerWhich: "start" });
    render(
      <AgendarPickers
        form={form}
        availability={availability}
        occupiedRanges={[]}
        isMobileLayout={false}
      />,
    );
    expect(screen.getByRole("dialog", { name: /event start time/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-time" }));
    expect(form.setEventTimeStart).toHaveBeenCalledWith("19:00");
    await user.click(screen.getByRole("button", { name: "close-time" }));
    expect(form.setTimePickerWhich).toHaveBeenCalledWith(null);
  });

  it("shows the end time picker on mobile overlay", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState({ timePickerWhich: "end" });
    render(
      <AgendarPickers
        form={form}
        availability={availability}
        occupiedRanges={[]}
        isMobileLayout
      />,
    );
    expect(screen.getByRole("dialog", { name: /event end time/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-time" }));
    expect(form.setEventTimeEnd).toHaveBeenCalledWith("19:00");
    await user.click(screen.getByRole("button", { name: "close-time" }));
    expect(form.setTimePickerWhich).toHaveBeenCalledWith(null);
  });
});
