/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeRecurringSchedule } from "@test/features/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/components/shared", () => ({
  RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { OnComingEventScheduleSection } from "@/features/on-coming-events/components/OnComingEventScheduleSection";

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
