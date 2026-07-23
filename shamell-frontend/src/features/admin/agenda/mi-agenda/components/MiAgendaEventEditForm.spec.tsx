/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/inputs", () => ({
  DateField: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <label>
      {label}
      <input
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  ),
}));

vi.mock("@/components/ShamellTime12hColumns", () => ({
  default: () => <div data-testid="time-columns" />,
}));

import MiAgendaEventEditForm from "./MiAgendaEventEditForm";

describe("MiAgendaEventEditForm", () => {
  const baseProps = {
    editDateIso: "2026-07-22",
    editStart: "10:00",
    editEnd: "11:30",
    editLocation: "Studio A",
    editNotes: "Bring shoes",
    savingEdit: false,
    savingCancel: false,
    onEditDateChange: vi.fn(),
    onEditStartChange: vi.fn(),
    onEditEndChange: vi.fn(),
    onEditLocationChange: vi.fn(),
    onEditNotesChange: vi.fn(),
    onSave: vi.fn(),
  };

  it("renders controlled field values", () => {
    renderWithProviders(<MiAgendaEventEditForm {...baseProps} />);
    expect(screen.getByLabelText("DATE")).toHaveValue("2026-07-22");
    expect(screen.getByDisplayValue("Studio A")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bring shoes")).toBeInTheDocument();
    expect(screen.getAllByTestId("time-columns")).toHaveLength(2);
  });

  it("updates location via onChange", async () => {
    const user = userEvent.setup();
    const onEditLocationChange = vi.fn();
    renderWithProviders(
      <MiAgendaEventEditForm
        {...baseProps}
        onEditLocationChange={onEditLocationChange}
      />,
    );
    await user.type(screen.getByDisplayValue("Studio A"), "!");
    expect(onEditLocationChange).toHaveBeenCalled();
  });

  it("saves and shows SAVING state", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const { rerender } = renderWithProviders(
      <MiAgendaEventEditForm {...baseProps} onSave={onSave} />,
    );
    await user.click(screen.getByRole("button", { name: "SAVE CHANGES" }));
    expect(onSave).toHaveBeenCalledOnce();

    rerender(<MiAgendaEventEditForm {...baseProps} savingEdit onSave={onSave} />);
    expect(screen.getByRole("button", { name: "SAVING..." })).toBeDisabled();
  });
});
