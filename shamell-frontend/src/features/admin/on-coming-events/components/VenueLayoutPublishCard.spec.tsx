/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { VenueLayoutPublishCard } from "./VenueLayoutPublishCard";

describe("VenueLayoutPublishCard", () => {
  it("shows Live on site when clientEnabled is true", () => {
    renderWithProviders(
      <VenueLayoutPublishCard
        clientEnabled
        isToggling={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Live on site")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("Preview public page")).toBeInTheDocument();
  });

  it("shows Hidden when clientEnabled is false", () => {
    renderWithProviders(
      <VenueLayoutPublishCard
        clientEnabled={false}
        isToggling={false}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByText("Hidden")).toBeInTheDocument();
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onToggle when switch is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithProviders(
      <VenueLayoutPublishCard
        clientEnabled={false}
        isToggling={false}
        onToggle={onToggle}
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalled();
  });
});
