/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import {
  ON_COMING_EVENTS_SITE_TAB_RESERVATION,
  ON_COMING_EVENTS_SITE_TAB_UPCOMING,
} from "@/lib/onComingEventsRoutes";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { OnComingEventsSiteSectionTabs } from "./OnComingEventsSiteSectionTabs";

describe("OnComingEventsSiteSectionTabs", () => {
  it("renders tablist with both section links", () => {
    renderWithProviders(
      <OnComingEventsSiteSectionTabs
        activeTab={ON_COMING_EVENTS_SITE_TAB_UPCOMING}
      />,
    );
    expect(
      screen.getByRole("tablist", { name: "On Coming Events site sections" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Upcoming Events" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("tab", { name: "Reservation event" }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("marks reservation tab as selected", () => {
    renderWithProviders(
      <OnComingEventsSiteSectionTabs
        activeTab={ON_COMING_EVENTS_SITE_TAB_RESERVATION}
      />,
    );
    expect(
      screen.getByRole("tab", { name: "Reservation event" }),
    ).toHaveAttribute("aria-selected", "true");
  });
});
