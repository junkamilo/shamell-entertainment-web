/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createScheduleViewModel } from "../../test/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "../../test/utils/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { OnComingEventScheduleCalendar } from "./OnComingEventScheduleCalendar";

describe("OnComingEventScheduleCalendar", () => {
  it("renders calendar label and month navigation", () => {
    renderWithProviders(
      <OnComingEventScheduleCalendar model={createScheduleViewModel()} />,
    );
    expect(screen.getByText("CALENDAR")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next month" })).toBeInTheDocument();
  });
});
