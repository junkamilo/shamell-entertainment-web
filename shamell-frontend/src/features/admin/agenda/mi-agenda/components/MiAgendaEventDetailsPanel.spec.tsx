/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEnrichedBooking } from "../test/fixtures/miAgenda.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./MiAgendaEventDetailsRead", () => ({
  default: () => <div data-testid="details-read" />,
}));

vi.mock("./MiAgendaEventEditForm", () => ({
  default: () => <div data-testid="details-edit" />,
}));

import MiAgendaEventDetailsPanel from "./MiAgendaEventDetailsPanel";

const baseHandlers = {
  onToggleEdit: vi.fn(),
  onOpenCancelModal: vi.fn(),
  onEditDateChange: vi.fn(),
  onEditStartChange: vi.fn(),
  onEditEndChange: vi.fn(),
  onEditLocationChange: vi.fn(),
  onEditNotesChange: vi.fn(),
  onSave: vi.fn(),
};

describe("MiAgendaEventDetailsPanel", () => {
  it("shows empty copy when nothing is selected", () => {
    renderWithProviders(
      <MiAgendaEventDetailsPanel
        selected={null}
        isEditing={false}
        savingEdit={false}
        savingCancel={false}
        editDateIso=""
        editStart=""
        editEnd=""
        editLocation=""
        editNotes=""
        {...baseHandlers}
      />,
    );
    expect(
      screen.getByText(/Select an event on the calendar/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "EDIT" })).not.toBeInTheDocument();
  });

  it("toggles between read and edit views", async () => {
    const user = userEvent.setup();
    const onToggleEdit = vi.fn();
    const { rerender } = renderWithProviders(
      <MiAgendaEventDetailsPanel
        selected={makeEnrichedBooking()}
        isEditing={false}
        savingEdit={false}
        savingCancel={false}
        editDateIso="2026-07-22"
        editStart="10:00"
        editEnd="11:30"
        editLocation="Studio"
        editNotes=""
        {...baseHandlers}
        onToggleEdit={onToggleEdit}
      />,
    );
    expect(screen.getByTestId("details-read")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "EDIT" }));
    expect(onToggleEdit).toHaveBeenCalledOnce();

    rerender(
      <MiAgendaEventDetailsPanel
        selected={makeEnrichedBooking()}
        isEditing
        savingEdit={false}
        savingCancel={false}
        editDateIso="2026-07-22"
        editStart="10:00"
        editEnd="11:30"
        editLocation="Studio"
        editNotes=""
        {...baseHandlers}
        onToggleEdit={onToggleEdit}
      />,
    );
    expect(screen.getByTestId("details-edit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CLOSE" })).toBeInTheDocument();
  });

  it("opens cancel modal and shows CANCELING state", async () => {
    const user = userEvent.setup();
    const onOpenCancelModal = vi.fn();
    const { rerender } = renderWithProviders(
      <MiAgendaEventDetailsPanel
        selected={makeEnrichedBooking()}
        isEditing={false}
        savingEdit={false}
        savingCancel={false}
        editDateIso=""
        editStart=""
        editEnd=""
        editLocation=""
        editNotes=""
        {...baseHandlers}
        onOpenCancelModal={onOpenCancelModal}
      />,
    );
    await user.click(screen.getByRole("button", { name: "CANCEL" }));
    expect(onOpenCancelModal).toHaveBeenCalledOnce();

    rerender(
      <MiAgendaEventDetailsPanel
        selected={makeEnrichedBooking()}
        isEditing={false}
        savingEdit={false}
        savingCancel
        editDateIso=""
        editStart=""
        editEnd=""
        editLocation=""
        editNotes=""
        {...baseHandlers}
        onOpenCancelModal={onOpenCancelModal}
      />,
    );
    expect(screen.getByRole("button", { name: "CANCELING..." })).toBeDisabled();
  });
});
