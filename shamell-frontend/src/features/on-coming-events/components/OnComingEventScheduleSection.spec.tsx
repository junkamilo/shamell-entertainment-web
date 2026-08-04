/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeRecurringSchedule } from "../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/components/shared", () => ({
  RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { OnComingEventScheduleSection } from "./OnComingEventScheduleSection";

describe("OnComingEventScheduleSection", () => {
  it("renders schedule section with calendar and time panels", () => {
    renderWithProviders(
      <OnComingEventScheduleSection schedule={makeRecurringSchedule()} />,
    );
    expect(screen.getByRole("heading", { name: "SCHEDULE" })).toBeInTheDocument();
    expect(screen.getAllByLabelText("Event calendar").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Event time and details").length).toBeGreaterThan(0);
  });
});
