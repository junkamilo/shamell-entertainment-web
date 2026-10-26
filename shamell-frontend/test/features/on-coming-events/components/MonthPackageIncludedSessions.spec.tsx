/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeClassSession } from "@test/features/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import { MonthPackageIncludedSessions } from "@/features/on-coming-events/components/MonthPackageIncludedSessions";

describe("MonthPackageIncludedSessions", () => {
  it("renders session count and week groups", () => {
    renderWithProviders(
      <MonthPackageIncludedSessions
        sessions={[makeClassSession()]}
        monthIso="2030-08"
        timezone="America/New_York"
      />,
    );
    expect(screen.getByText("1 class")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /collapse all/i })).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });
});
