/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createScheduleViewModel } from "@test/features/on-coming-events/support/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { OnComingEventScheduleTimeArc } from "@/features/on-coming-events/components/schedule/OnComingEventScheduleTimeArc";

describe("OnComingEventScheduleTimeArc", () => {
  it("renders time panel with weekly schedule details", () => {
    renderWithProviders(
      <OnComingEventScheduleTimeArc model={createScheduleViewModel()} />,
    );
    expect(screen.getByText("TIME")).toBeInTheDocument();
    expect(screen.getByText("Classes by day")).toBeInTheDocument();
    expect(screen.getByText(/Monday \(1 section\)/i)).toBeInTheDocument();
    expect(screen.getByText(/times shown in/i)).toBeInTheDocument();
  });
});
