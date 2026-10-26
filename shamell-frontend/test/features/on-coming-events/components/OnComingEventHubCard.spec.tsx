/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeHubEvent } from "@test/features/on-coming-events/support/fixtures/onComingEvents.fixture";
import { FIXTURE_EVENT_SLUG } from "@test/features/on-coming-events/support/fixtures/uuids.fixture";
import { renderWithProviders } from "@test/features/on-coming-events/support/helpers/renderWithProviders";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
    prefetch?: boolean;
  }) => (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/hooks/use-has-mounted", () => ({
  useHasMounted: () => true,
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

import { OnComingEventHubCard } from "@/features/on-coming-events/components/OnComingEventHubCard";

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
    const link = screen.getByRole("link", { name: /book a session/i });
    expect(link).toHaveAttribute("href", `/upcoming-events/${FIXTURE_EVENT_SLUG}`);
  });

  it("navigates to seats for venue_seating CTA", async () => {
    pushMock.mockClear();
    const user = userEvent.setup();
    const slug = "este-es-un-evento-especial-999218a3";
    renderWithProviders(
      <OnComingEventHubCard
        event={{
          slug,
          eventTypeName: "BELLY DANCE PASSION SHOW",
          heroImageUrl: "https://cdn.example/flyer.jpg",
          heroMediaType: "IMAGE",
          purchaseMode: "venue_seating",
          purchasable: true,
          eventStartsAt: "2030-08-15T18:00:00.000Z",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: /buy tables \/ seats/i });
    expect(link).toHaveAttribute("href", `/upcoming-events/${slug}/seats`);

    await user.click(link);
    expect(pushMock).toHaveBeenCalledWith(`/upcoming-events/${slug}/seats`);
  });
});
