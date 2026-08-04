/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/on-coming-events/onComingEventsRoutes";
import { makeOnComingEventDetail } from "../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { OnComingEventHeroSection } from "./OnComingEventHeroSection";

describe("OnComingEventHeroSection", () => {
  it("renders event title and price badge", () => {
    const detail = makeOnComingEventDetail();
    renderWithProviders(
      <OnComingEventHeroSection
        title={detail.eventTypeName}
        heroImageUrl={detail.heroImageUrl}
        heroMediaType={detail.heroMediaType}
        backFallbackHref={ON_COMING_EVENTS_PUBLIC_PATH}
        price={detail.price}
        showPrice
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Weekly Bachata" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/price 25 usd/i)).toBeInTheDocument();
  });
});
