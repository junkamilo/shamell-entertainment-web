/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createScheduleViewModel } from "@test/features/on-coming-events/support/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { ScheduleTimeGauge } from "@/features/on-coming-events/components/schedule/ScheduleTimeGauge";

describe("ScheduleTimeGauge", () => {
  it("renders time range gauge with accessible label", () => {
    const model = createScheduleViewModel();
    renderWithProviders(
      <ScheduleTimeGauge
        arcs={model.timeArcs}
        durationTotalMinutes={model.durationTotalMinutes}
        durationLabel={model.durationLabel}
        timeRangeLabel={model.timeRangeLabel}
      />,
    );
    expect(
      screen.getByRole("img", { name: /7:00 pm – 8:00 pm, duration 1h/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(model.timeRangeLabel)).toBeInTheDocument();
  });
});
