/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
}));

import OnComingEventsHubPage from "./OnComingEventsHubPage";

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
