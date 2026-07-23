/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import type { AgendarAvailability } from "../types/agendarAvailability.types";
import { AgendarPickers } from "./AgendarPickers";

vi.mock("@/features/contacto/components/ContactDatePickerModal", () => ({
  default: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div role="dialog" aria-label={title} /> : null,
}));

vi.mock("@/features/contacto/components/ContactTimePickerModal", () => ({
  default: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div role="dialog" aria-label={title} /> : null,
}));

const availability = {
  bookingTz: "America/New_York",
  blockedIsoDates: new Set<string>(),
  blockedReasonByIso: new Map<string, string>(),
  startTimeClamp: undefined,
  minSelectableIso: "2026-07-01",
} as AgendarAvailability;

describe("AgendarPickers", () => {
  it("shows the date picker when open", () => {
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
  });

  it("shows the start time picker", () => {
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
  });

  it("shows the end time picker", () => {
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
  });
});
