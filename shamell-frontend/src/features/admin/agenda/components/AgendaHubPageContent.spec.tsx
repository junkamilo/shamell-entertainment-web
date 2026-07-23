/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AGENDA_HUB_CARDS } from "../lib/agendaHubCards";
import { AGENDA_HUB_HERO } from "../lib/agendaHubHero";
import { makeAgendaHubBadges } from "../test/fixtures/agendaHub.fixture";
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

import AgendaHubPageContent from "./AgendaHubPageContent";

describe("AgendaHubPageContent", () => {
  it("renders the hero title and inbox action", () => {
    renderWithProviders(
      <AgendaHubPageContent {...makeAgendaHubBadges()} />,
    );

    expect(
      screen.getByRole("heading", { name: AGENDA_HUB_HERO.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: `+ ${AGENDA_HUB_HERO.actionLabel}` }),
    ).toHaveAttribute("href", AGENDA_HUB_HERO.actionHref);
  });

  it("renders every hub card", () => {
    renderWithProviders(
      <AgendaHubPageContent {...makeAgendaHubBadges()} />,
    );

    const links = screen.getAllByRole("link");
    for (const card of AGENDA_HUB_CARDS) {
      expect(screen.getByText(card.title.toUpperCase())).toBeInTheDocument();
      expect(screen.getByText(card.subtitle)).toBeInTheDocument();
      expect(links.some((link) => link.getAttribute("href") === card.href)).toBe(
        true,
      );
    }
  });

  it("hides the notification subtitle when badges are zero", () => {
    renderWithProviders(
      <AgendaHubPageContent {...makeAgendaHubBadges()} />,
    );
    expect(
      screen.queryByText(/payment or inbox update/i),
    ).not.toBeInTheDocument();
  });

  it("shows the notification subtitle from badge totals", () => {
    renderWithProviders(
      <AgendaHubPageContent
        {...makeAgendaHubBadges({
          peticionesBadge: 2,
          paymentHistoryBadge: 1,
        })}
      />,
    );
    expect(
      screen.getByText("3 payment or inbox updates since your last visit"),
    ).toBeInTheDocument();
  });

  it("passes badge counts onto inbox and payment history cards", () => {
    renderWithProviders(
      <AgendaHubPageContent
        {...makeAgendaHubBadges({
          peticionesBadge: 4,
          paymentHistoryBadge: 7,
        })}
      />,
    );
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
