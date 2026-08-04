/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeHubEvent } from "../test/fixtures/onComingEvents.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/catalog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/catalog")>();
  return {
    ...actual,
    EventCatalogCardHero: ({ title }: { title: string }) => (
      <div data-testid="event-hero">{title}</div>
    ),
  };
});

import { OnComingEventHubCard } from "./OnComingEventHubCard";

describe("OnComingEventHubCard", () => {
  it("renders event name and classes CTA", () => {
    const event = makeHubEvent();
    renderWithProviders(
      <OnComingEventHubCard
        event={{
          slug: String(event.slug),
          eventTypeName: String(event.eventTypeName),
          heroImageUrl: String(event.heroImageUrl),
          heroMediaType: "IMAGE",
          purchaseMode: "classes",
          purchasable: true,
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Weekly Bachata" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /book a session/i })).toBeInTheDocument();
  });
});
