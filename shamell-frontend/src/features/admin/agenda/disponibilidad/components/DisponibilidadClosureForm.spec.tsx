/** @vitest-environment jsdom */

import type { FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import DisponibilidadClosureForm from "./DisponibilidadClosureForm";

function baseProps(
  overrides: Partial<React.ComponentProps<typeof DisponibilidadClosureForm>> = {},
) {
  return {
    closureKind: "SPECIFIC_DATE" as const,
    closureDate: "",
    closureStartDate: "",
    closureEndDate: "",
    closureWeekday: 0,
    closureNote: "",
    addingClosure: false,
    onClosureKindChange: vi.fn(),
    onClosureWeekdayChange: vi.fn(),
    onClosureNoteChange: vi.fn(),
    onOpenDatePicker: vi.fn(),
    onSubmit: vi.fn((e: FormEvent) => e.preventDefault()),
    ...overrides,
  };
}

describe("DisponibilidadClosureForm", () => {
  it("renders TYPE, DATE, and ADD CLOSURE for SPECIFIC_DATE", () => {
    renderWithProviders(<DisponibilidadClosureForm {...baseProps()} />);
    expect(screen.getByText("TYPE")).toBeInTheDocument();
    expect(screen.getByText("DATE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add closure/i })).toBeInTheDocument();
  });

  it("calls onOpenDatePicker('single') when 'Choose date' is clicked", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    renderWithProviders(<DisponibilidadClosureForm {...props} />);

    // These trigger buttons live inside a <label> next to a hidden input, so
    // their computed accessible *role* name is the label text (e.g. "DATE"),
    // not their own button text — query by visible text instead.
    await user.click(screen.getByText("Choose date"));
    expect(props.onOpenDatePicker).toHaveBeenCalledWith("single");
  });

  it("shows FROM/THROUGH for DATE_RANGE", () => {
    renderWithProviders(
      <DisponibilidadClosureForm {...baseProps({ closureKind: "DATE_RANGE" })} />,
    );
    expect(screen.getByText("FROM")).toBeInTheDocument();
    expect(screen.getByText("THROUGH")).toBeInTheDocument();
  });

  it("calls onOpenDatePicker('start'/'end') for the range choose buttons", async () => {
    const user = userEvent.setup();
    const props = baseProps({ closureKind: "DATE_RANGE" });
    renderWithProviders(<DisponibilidadClosureForm {...props} />);

    await user.click(screen.getByText("Choose start date"));
    expect(props.onOpenDatePicker).toHaveBeenCalledWith("start");

    await user.click(screen.getByText("Choose end date"));
    expect(props.onOpenDatePicker).toHaveBeenCalledWith("end");
  });

  it("shows DAY OF WEEK for RECURRING_WEEKDAY", () => {
    renderWithProviders(
      <DisponibilidadClosureForm {...baseProps({ closureKind: "RECURRING_WEEKDAY" })} />,
    );
    expect(screen.getByText("DAY OF WEEK")).toBeInTheDocument();
  });

  it("changes the closure kind via the TYPE select", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    renderWithProviders(<DisponibilidadClosureForm {...props} />);

    await user.click(screen.getByRole("button", { name: /select closure type/i }));
    await user.click(screen.getByRole("option", { name: "Date range (from / through)" }));

    expect(props.onClosureKindChange).toHaveBeenCalledWith("DATE_RANGE");
  });

  it("changes the recurring weekday via the DAY OF WEEK select", async () => {
    const user = userEvent.setup();
    const props = baseProps({ closureKind: "RECURRING_WEEKDAY" });
    renderWithProviders(<DisponibilidadClosureForm {...props} />);

    await user.click(screen.getByRole("button", { name: /select day of week/i }));
    await user.click(screen.getByRole("option", { name: "Monday" }));

    expect(props.onClosureWeekdayChange).toHaveBeenCalledWith("1");
  });

  it("updates the note field", async () => {
    const user = userEvent.setup();
    const props = baseProps();
    renderWithProviders(<DisponibilidadClosureForm {...props} />);

    await user.type(screen.getByPlaceholderText(/travel, holiday/i), "x");
    expect(props.onClosureNoteChange).toHaveBeenCalled();
  });

  it("submits the form", async () => {
    const user = userEvent.setup();
    const props = baseProps({ closureDate: "2030-01-01" });
    renderWithProviders(<DisponibilidadClosureForm {...props} />);

    await user.click(screen.getByRole("button", { name: /add closure/i }));
    expect(props.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables ADD CLOSURE while adding", () => {
    renderWithProviders(<DisponibilidadClosureForm {...baseProps({ addingClosure: true })} />);
    expect(screen.getByRole("button", { name: /add closure/i })).toBeDisabled();
  });
});
