/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EventCatalogCardExpandSections } from "./EventCatalogCardExpandSections";

describe("EventCatalogCardExpandSections", () => {
  it("toggles description and event types panels", async () => {
    const user = userEvent.setup();
    render(
      <EventCatalogCardExpandSections
        description="A luxury performance package."
        eventTypes={["Wedding", "Corporate"]}
        cardId="evt-1"
      />,
    );

    const descriptionSection = screen.getByRole("heading", { name: "DESCRIPTION" }).parentElement!;
    const typesSection = screen.getByRole("heading", { name: "EVENT TYPES" }).parentElement!;

    const descriptionToggle = within(descriptionSection).getByRole("button");
    const typesToggle = within(typesSection).getByRole("button");

    expect(descriptionToggle).toHaveAttribute("aria-expanded", "false");
    expect(typesToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("A luxury performance package.")).toBeInTheDocument();

    await user.click(descriptionToggle);
    expect(descriptionToggle).toHaveAttribute("aria-expanded", "true");

    await user.click(typesToggle);
    expect(typesToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Wedding")).toBeInTheDocument();
    expect(screen.getByText("Corporate")).toBeInTheDocument();
  });
});
