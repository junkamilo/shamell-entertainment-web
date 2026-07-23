/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import PeticionesStatsBar from "./PeticionesStatsBar";

describe("PeticionesStatsBar", () => {
  it("renders totals and pending counts", () => {
    renderWithProviders(
      <PeticionesStatsBar
        isLoading={false}
        totalItems={12}
        pendingCount={3}
        error={null}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getByText("Total:")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("Pending:")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows loading placeholders and disables refresh", () => {
    renderWithProviders(
      <PeticionesStatsBar
        isLoading
        totalItems={0}
        pendingCount={0}
        error={null}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getAllByText("…")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /REFRESH/i })).toBeDisabled();
  });

  it("shows error and wires refresh", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    renderWithProviders(
      <PeticionesStatsBar
        isLoading={false}
        totalItems={1}
        pendingCount={0}
        error="Not signed in."
        onRefresh={onRefresh}
      />,
    );
    expect(screen.getByText("Not signed in.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /REFRESH/i }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
