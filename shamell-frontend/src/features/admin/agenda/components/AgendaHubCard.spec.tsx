/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeAgendaHubCard } from "../test/fixtures/agendaHub.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    className,
  }: {
    src: string;
    alt: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  ),
}));

import AgendaHubCard from "./AgendaHubCard";

describe("AgendaHubCard", () => {
  it("renders title, subtitle, link, and open cue", () => {
    const card = makeAgendaHubCard();
    renderWithProviders(<AgendaHubCard card={card} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", card.href);
    expect(screen.getByText("INBOX")).toBeInTheDocument();
    expect(screen.getByText(card.subtitle)).toBeInTheDocument();
    expect(screen.getByText("OPEN →")).toBeInTheDocument();
  });

  it("hides the badge when count is zero", () => {
    renderWithProviders(
      <AgendaHubCard card={makeAgendaHubCard()} badgeCount={0} />,
    );
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the badge count when greater than zero", () => {
    renderWithProviders(
      <AgendaHubCard card={makeAgendaHubCard()} badgeCount={3} />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the badge display at 99+", () => {
    renderWithProviders(
      <AgendaHubCard card={makeAgendaHubCard()} badgeCount={120} />,
    );
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("applies the fire card class when fire is true", () => {
    const card = makeAgendaHubCard({ fire: true });
    renderWithProviders(<AgendaHubCard card={card} />);
    expect(screen.getByRole("link").className).toContain(
      "shamell-glass-card--fire",
    );
  });
});
