/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeOnComingEventDetail } from "@test/features/on-coming-events/support/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

import { OnComingEventItemsSection } from "@/features/on-coming-events/components/OnComingEventItemsSection";

describe("OnComingEventItemsSection", () => {
  it("renders included items heading and list entries", () => {
    const detail = makeOnComingEventDetail();
    renderWithProviders(<OnComingEventItemsSection items={detail.items} />);
    expect(screen.getByRole("heading", { name: /what's included/i })).toBeInTheDocument();
    expect(screen.getAllByText("Floor practice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Partner work").length).toBeGreaterThan(0);
  });

  it("renders nothing when items are empty", () => {
    const { container } = renderWithProviders(
      <OnComingEventItemsSection items={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
