/** @vitest-environment jsdom */

import type { FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import DisponibilidadWeeklyPanel from "./DisponibilidadWeeklyPanel";
import { defaultWeekly } from "../lib/disponibilidadConstants";
import { makeAdminAvailabilitySnapshot } from "../test/fixtures/disponibilidad.fixture";

function baseProps(
  overrides: Partial<React.ComponentProps<typeof DisponibilidadWeeklyPanel>> = {},
) {
  return {
    snapshot: makeAdminAvailabilitySnapshot(),
    isLoading: false,
    error: null,
    rows: defaultWeekly(),
    savingWeekly: false,
    onSaveWeekly: vi.fn((e: FormEvent) => e.preventDefault()),
    onReload: vi.fn(),
    onRowClosedChange: vi.fn(),
    onOpenTimePicker: vi.fn(),
    ...overrides,
  };
}

describe("DisponibilidadWeeklyPanel", () => {
  it("shows a loading spinner (no form) while loading with no snapshot yet", () => {
    renderWithProviders(
      <DisponibilidadWeeklyPanel {...baseProps({ snapshot: null, isLoading: true })} />,
    );
    expect(screen.getByText("WEEKLY HOURS")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /save hours/i })).not.toBeInTheDocument();
  });

  it("renders the form with rows, SAVE HOURS, and RELOAD once loaded", () => {
    renderWithProviders(<DisponibilidadWeeklyPanel {...baseProps()} />);
    expect(screen.getByText("Sunday")).toBeInTheDocument();
    expect(screen.getByText("Monday")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save hours/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RELOAD" })).toBeInTheDocument();
  });

  it("still renders the form when isLoading is true but a snapshot already exists", () => {
    renderWithProviders(<DisponibilidadWeeklyPanel {...baseProps({ isLoading: true })} />);
    expect(screen.getByRole("button", { name: /save hours/i })).toBeInTheDocument();
  });

  it("shows the error text when present", () => {
    renderWithProviders(
      <DisponibilidadWeeklyPanel {...baseProps({ error: "Could not load availability." })} />,
    );
    expect(screen.getByText("Could not load availability.")).toBeInTheDocument();
  });

  it("submits the form via onSaveWeekly", async () => {
    const user = userEvent.setup();
    const onSaveWeekly = vi.fn((e: FormEvent) => e.preventDefault());
    renderWithProviders(<DisponibilidadWeeklyPanel {...baseProps({ onSaveWeekly })} />);

    await user.click(screen.getByRole("button", { name: /save hours/i }));
    expect(onSaveWeekly).toHaveBeenCalledOnce();
  });

  it("calls onReload when RELOAD is clicked", async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderWithProviders(<DisponibilidadWeeklyPanel {...baseProps({ onReload })} />);

    await user.click(screen.getByRole("button", { name: "RELOAD" }));
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("disables SAVE HOURS while saving", () => {
    renderWithProviders(<DisponibilidadWeeklyPanel {...baseProps({ savingWeekly: true })} />);
    expect(screen.getByRole("button", { name: /save hours/i })).toBeDisabled();
  });
});
