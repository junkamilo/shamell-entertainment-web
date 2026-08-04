/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { EventCatalogItem } from "../types";
import { EventCatalogCard } from "./EventCatalogCard";

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

vi.mock("../EventCatalogCardHero", () => ({
  EventCatalogCardHero: ({ title }: { title: string }) => (
    <div data-testid="hero">{title}</div>
  ),
}));

vi.mock("../EventCatalogCardExpandSections", () => ({
  EventCatalogCardExpandSections: () => <div data-testid="expand-sections" />,
}));

const baseItem: EventCatalogItem = {
  id: "11111111-1111-4111-8111-111111111111",
  eventTypeName: "Private Gala",
  description: "Desc",
  eventTypes: ["Gala"],
  price: null,
  heroImageUrl: null,
};

describe("EventCatalogCard", () => {
  it("renders title and Inquire CTA without price", () => {
    render(<EventCatalogCard item={baseItem} />);
    expect(screen.getByRole("heading", { name: "PRIVATE GALA" })).toBeInTheDocument();
    expect(screen.queryByText("From")).not.toBeInTheDocument();
    const inquire = screen.getByRole("link", { name: /inquire/i });
    expect(inquire).toHaveAttribute(
      "href",
      expect.stringContaining("eventId=11111111-1111-4111-8111-111111111111"),
    );
  });

  it("renders price when set", () => {
    render(<EventCatalogCard item={{ ...baseItem, price: 1500 }} />);
    expect(screen.getByText("From")).toBeInTheDocument();
    expect(screen.getByText("$1,500")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("uses primary action and secondary inquire link", () => {
    render(
      <EventCatalogCard
        item={baseItem}
        primaryActionHref="/on-coming-events/gala"
        primaryActionLabel="View event"
      />,
    );
    expect(screen.getByRole("link", { name: /view event/i })).toHaveAttribute(
      "href",
      "/on-coming-events/gala",
    );
    expect(
      screen.getByRole("link", { name: /or inquire without booking/i }),
    ).toBeInTheDocument();
  });
});
