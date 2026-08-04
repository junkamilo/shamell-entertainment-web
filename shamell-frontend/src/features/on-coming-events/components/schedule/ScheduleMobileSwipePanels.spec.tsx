/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { ScheduleMobileSwipePanels } from "./ScheduleMobileSwipePanels";

describe("ScheduleMobileSwipePanels", () => {
  it("renders swipe panels with calendar and time content", () => {
    renderWithProviders(
      <ScheduleMobileSwipePanels
        calendar={<div>Calendar panel</div>}
        timePanel={<div>Time panel</div>}
      />,
    );
    expect(screen.getByLabelText("Schedule calendar and time details")).toBeInTheDocument();
    expect(screen.getByText("Calendar panel")).toBeInTheDocument();
    expect(screen.getByText("Time panel")).toBeInTheDocument();
    expect(screen.getByText(/swipe for time & details/i)).toBeInTheDocument();
  });
});
