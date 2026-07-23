/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import DisponibilidadClosuresList from "./DisponibilidadClosuresList";
import {
  makeSpecificClosure,
  makeRangeClosure,
  makeRecurringClosure,
} from "../test/fixtures/disponibilidad.fixture";

describe("DisponibilidadClosuresList", () => {
  it("shows the empty message when there are no closures", () => {
    renderWithProviders(<DisponibilidadClosuresList closures={[]} onRequestDelete={vi.fn()} />);
    expect(screen.getByText("No extra closures configured.")).toBeInTheDocument();
  });

  it("shows the Date: line and note for a specific-date closure", () => {
    renderWithProviders(
      <DisponibilidadClosuresList closures={[makeSpecificClosure()]} onRequestDelete={vi.fn()} />,
    );
    expect(screen.getByText("Date: 2030-12-25")).toBeInTheDocument();
    expect(screen.getByText("Holiday")).toBeInTheDocument();
  });

  it("shows the Range: line for a date-range closure", () => {
    renderWithProviders(
      <DisponibilidadClosuresList closures={[makeRangeClosure()]} onRequestDelete={vi.fn()} />,
    );
    expect(screen.getByText("Range: 2030-07-01 through 2030-07-05")).toBeInTheDocument();
  });

  it("shows the 'Every <weekday>' line for a recurring closure", () => {
    renderWithProviders(
      <DisponibilidadClosuresList
        closures={[makeRecurringClosure({ weekday: 0 })]}
        onRequestDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Every Sunday")).toBeInTheDocument();
  });

  it("does not render a note paragraph when note is null", () => {
    renderWithProviders(
      <DisponibilidadClosuresList
        closures={[makeRecurringClosure({ note: null })]}
        onRequestDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText("Holiday")).not.toBeInTheDocument();
  });

  it("calls onRequestDelete with the closure id from REMOVE", async () => {
    const user = userEvent.setup();
    const onRequestDelete = vi.fn();
    const closure = makeSpecificClosure();
    renderWithProviders(
      <DisponibilidadClosuresList closures={[closure]} onRequestDelete={onRequestDelete} />,
    );

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRequestDelete).toHaveBeenCalledWith(closure.id);
  });
});
