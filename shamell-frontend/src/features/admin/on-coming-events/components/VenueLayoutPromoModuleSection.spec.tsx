/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { CalendarDays } from "lucide-react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { VenueLayoutPromoModuleSection } from "./VenueLayoutPromoModuleSection";

describe("VenueLayoutPromoModuleSection", () => {
  it("renders title, description, and children", () => {
    renderWithProviders(
      <VenueLayoutPromoModuleSection
        icon={CalendarDays}
        title="Reservation event"
        description="Publish the floor plan on the public site."
        headerAction={<button type="button">Edit</button>}
      >
        <p>Child content</p>
      </VenueLayoutPromoModuleSection>,
    );
    expect(
      screen.getByRole("heading", { name: "Reservation event" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Publish the floor plan on the public site."),
    ).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
