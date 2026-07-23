/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import PeticionesLaneTabs from "./PeticionesLaneTabs";

describe("PeticionesLaneTabs", () => {
  it("renders all lane buttons", () => {
    renderWithProviders(
      <PeticionesLaneTabs activeLane="bookings" onLaneChange={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: /BOOKINGS & REQUESTS/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /GUIDANCE/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /PRIVATE CLASSES/i }),
    ).toBeInTheDocument();
  });

  it("calls onLaneChange for each lane", async () => {
    const user = userEvent.setup();
    const onLaneChange = vi.fn();
    renderWithProviders(
      <PeticionesLaneTabs activeLane="bookings" onLaneChange={onLaneChange} />,
    );
    await user.click(screen.getByRole("button", { name: /GUIDANCE/i }));
    expect(onLaneChange).toHaveBeenCalledWith("guidance");
    await user.click(screen.getByRole("button", { name: /PRIVATE CLASSES/i }));
    expect(onLaneChange).toHaveBeenCalledWith("private_classes");
  });

  it("shows unread dots when inactive lanes have unread counts", () => {
    renderWithProviders(
      <PeticionesLaneTabs
        activeLane="bookings"
        onLaneChange={vi.fn()}
        guidanceUnread={2}
        privateClassesUnread={1}
      />,
    );
    expect(screen.getByLabelText("2 new guidance requests")).toBeInTheDocument();
    expect(screen.getByLabelText("1 new private class")).toBeInTheDocument();
  });
});
