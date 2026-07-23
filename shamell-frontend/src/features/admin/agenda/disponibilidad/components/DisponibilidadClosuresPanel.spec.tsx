/** @vitest-environment jsdom */

import type { FormEvent } from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import DisponibilidadClosuresPanel from "./DisponibilidadClosuresPanel";
import {
  makeAdminAvailabilitySnapshot,
  makeSpecificClosure,
} from "../test/fixtures/disponibilidad.fixture";

function baseProps(
  overrides: Partial<React.ComponentProps<typeof DisponibilidadClosuresPanel>> = {},
) {
  return {
    snapshot: makeAdminAvailabilitySnapshot({ closures: [makeSpecificClosure()] }),
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
    onAddClosure: vi.fn((e: FormEvent) => e.preventDefault()),
    onRequestDelete: vi.fn(),
    ...overrides,
  };
}

describe("DisponibilidadClosuresPanel", () => {
  it("renders both the mobile and desktop CLOSURES heading variants", () => {
    renderWithProviders(<DisponibilidadClosuresPanel {...baseProps()} />);
    expect(screen.getByText("CLOSURES")).toBeInTheDocument();
    expect(
      screen.getByText("CLOSURES (time off / single day / weekly recurring)"),
    ).toBeInTheDocument();
  });

  it("renders the closure form and the closures list", () => {
    renderWithProviders(<DisponibilidadClosuresPanel {...baseProps()} />);
    expect(screen.getByRole("button", { name: /add closure/i })).toBeInTheDocument();
    expect(screen.getByText("Date: 2030-12-25")).toBeInTheDocument();
  });

  it("shows the empty closures message when there are none", () => {
    renderWithProviders(
      <DisponibilidadClosuresPanel
        {...baseProps({ snapshot: makeAdminAvailabilitySnapshot({ closures: [] }) })}
      />,
    );
    expect(screen.getByText("No extra closures configured.")).toBeInTheDocument();
  });

  it("handles a null snapshot by rendering an empty closures list", () => {
    renderWithProviders(<DisponibilidadClosuresPanel {...baseProps({ snapshot: null })} />);
    expect(screen.getByText("No extra closures configured.")).toBeInTheDocument();
  });
});
