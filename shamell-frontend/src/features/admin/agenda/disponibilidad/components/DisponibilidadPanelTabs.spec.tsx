/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import DisponibilidadPanelTabs from "./DisponibilidadPanelTabs";

describe("DisponibilidadPanelTabs", () => {
  it("renders WEEKLY HOURS and CLOSURES buttons", () => {
    renderWithProviders(
      <DisponibilidadPanelTabs activePanel="weekly" onPanelChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "WEEKLY HOURS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CLOSURES" })).toBeInTheDocument();
  });

  it("calls onPanelChange with 'weekly' when WEEKLY HOURS is clicked", async () => {
    const user = userEvent.setup();
    const onPanelChange = vi.fn();
    renderWithProviders(
      <DisponibilidadPanelTabs activePanel="closures" onPanelChange={onPanelChange} />,
    );

    await user.click(screen.getByRole("button", { name: "WEEKLY HOURS" }));
    expect(onPanelChange).toHaveBeenCalledWith("weekly");
  });

  it("calls onPanelChange with 'closures' when CLOSURES is clicked", async () => {
    const user = userEvent.setup();
    const onPanelChange = vi.fn();
    renderWithProviders(
      <DisponibilidadPanelTabs activePanel="weekly" onPanelChange={onPanelChange} />,
    );

    await user.click(screen.getByRole("button", { name: "CLOSURES" }));
    expect(onPanelChange).toHaveBeenCalledWith("closures");
  });
});
