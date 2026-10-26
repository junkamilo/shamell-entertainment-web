/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/components/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared")>();
  return {
    ...actual,
    Footer: () => <footer data-testid="site-footer" />,
  };
});

import OnComingEventsHubPage from "@/features/on-coming-events/components/OnComingEventsHubPage";

describe("OnComingEventsHubPage", () => {
  it("loads hub events from API and renders event card", async () => {
    renderWithProviders(<OnComingEventsHubPage />);
    await waitFor(() => {
      expect(
        screen.getAllByRole("heading", { name: "Weekly Bachata" }).length,
      ).toBeGreaterThan(0);
    });
    expect(
      screen.getByText(/browse upcoming experiences/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });
});
