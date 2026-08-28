/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeClassSession,
  makeMonthPackage,
  makeOnComingEventDetail,
} from "../test/fixtures/onComingEvents.fixture";
import { FIXTURE_EVENT_SLUG } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const fetchDetailMock = vi.fn();
const cartMock = {
  items: [{ sessionId: "s1", dateIso: "2030-08-04", price: 25 }],
  count: 1,
  total: 25,
  replaceDay: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

vi.mock("../services/fetchOnComingEventDetail", () => ({
  fetchOnComingEventDetail: (...args: unknown[]) => fetchDetailMock(...args),
}));

vi.mock("../hooks/useClassSessionCart", () => ({
  useClassSessionCart: () => cartMock,
}));

vi.mock("@/components/shared", () => ({
  Footer: () => <footer data-testid="site-footer" />,
  ShamellBusyOverlay: ({ active, title }: { active: boolean; title: string }) =>
    active ? <div data-testid="busy">{title}</div> : null,
  ShamellBackButton: ({
    fallbackHref,
    onNavigateStart,
  }: {
    fallbackHref: string;
    onNavigateStart?: () => void;
  }) => (
    <button type="button" onClick={onNavigateStart}>
      back-{fallbackHref}
    </button>
  ),
  FixedTicketInventoryDisplay: ({
    inventoryType,
    soldOut,
  }: {
    inventoryType?: string;
    soldOut?: boolean;
  }) => (
    <div data-testid={inventoryType === "table" ? "table-inventory" : "ticket-inventory"}>
      {soldOut ? "sold-out" : "in-stock"}
    </div>
  ),
  isFutureEventStart: (iso?: string) => Boolean(iso),
  ShamellCountdown: ({ targetAt }: { targetAt: string }) => (
    <div data-testid="countdown">{targetAt}</div>
  ),
}));

vi.mock("./OnComingEventHeroSection", () => ({
  OnComingEventHeroSection: ({
    title,
    showPrice,
    priceAriaLabel,
    priceBadge,
    onBackNavigate,
  }: {
    title: string;
    showPrice?: boolean;
    priceAriaLabel?: string;
    priceBadge?: ReactNode;
    onBackNavigate?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      {showPrice ? <div data-testid="hero-price">{priceAriaLabel}</div> : null}
      {priceBadge}
      <button type="button" onClick={onBackNavigate}>
        hero-back
      </button>
    </div>
  ),
}));

vi.mock("./OnComingEventItemsSection", () => ({
  OnComingEventItemsSection: () => <div data-testid="items-section" />,
}));

vi.mock("./OnComingEventScheduleSection", () => ({
  OnComingEventScheduleSection: ({
    calendarBookable,
    onCalendarDateClick,
  }: {
    calendarBookable?: boolean;
    onCalendarDateClick?: (iso: string) => void;
  }) =>
    calendarBookable ? (
      <button type="button" onClick={() => onCalendarDateClick?.("2030-08-04")}>
        pick-date
      </button>
    ) : (
      <div data-testid="schedule-readonly" />
    ),
}));

vi.mock("./OnComingEventStickyPurchaseBar", () => ({
  OnComingEventStickyPurchaseBar: ({
    onBuyTicket,
    onBuyMonthPackage,
    onCartCheckout,
    showMonthPackage,
  }: {
    onBuyTicket?: () => void;
    onBuyMonthPackage?: () => void;
    onCartCheckout?: () => void;
    showMonthPackage?: boolean;
  }) => (
    <div data-testid="purchase-bar">
      {onBuyTicket ? (
        <button type="button" onClick={onBuyTicket}>
          buy-ticket
        </button>
      ) : null}
      {showMonthPackage ? (
        <button type="button" onClick={onBuyMonthPackage}>
          buy-month
        </button>
      ) : null}
      {onCartCheckout ? (
        <button type="button" onClick={onCartCheckout}>
          cart-checkout
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock("./ClassBookingWizard", () => ({
  ClassBookingWizard: ({
    open,
    entryFlow,
    onClose,
  }: {
    open: boolean;
    entryFlow: string;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="class-wizard">
        <span>{entryFlow}</span>
        <button type="button" onClick={onClose}>
          close-wizard
        </button>
      </div>
    ) : null,
  weekdayFromIsoDate: () => 1,
}));

vi.mock("./OnComingEventFixedTicketBookingModal", () => ({
  OnComingEventFixedTicketBookingModal: ({
    open,
    onClose,
  }: {
    open: boolean;
    onClose: () => void;
  }) =>
    open ? (
      <button type="button" onClick={onClose}>
        close-ticket
      </button>
    ) : null,
}));

import OnComingEventDetailPage from "./OnComingEventDetailPage";

describe("OnComingEventDetailPage", () => {
  beforeEach(() => {
    fetchDetailMock.mockReset();
    fetchDetailMock.mockResolvedValue(makeOnComingEventDetail());
  });

  it("loads event detail and renders hero title", async () => {
    renderWithProviders(<OnComingEventDetailPage slug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByRole("heading", { name: "Weekly Bachata" })).toBeInTheDocument();
    expect(screen.getByText(/beginner-friendly weekly class/i)).toBeInTheDocument();
    expect(screen.getByTestId("items-section")).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
    expect(screen.getByTestId("hero-price")).toHaveTextContent(/USD/);
  });

  it("shows a range price when class sessions differ", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        sessions: [
          makeClassSession({ id: "a", price: 20 }),
          makeClassSession({ id: "b", price: 40 }),
        ],
      }),
    );
    renderWithProviders(<OnComingEventDetailPage slug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByTestId("hero-price")).toHaveTextContent(/from/i);
  });

  it("opens day, month, and cart booking flows", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OnComingEventDetailPage slug={FIXTURE_EVENT_SLUG} />);
    await screen.findByRole("heading", { name: "Weekly Bachata" });

    await user.click(screen.getByRole("button", { name: "pick-date" }));
    expect(screen.getByTestId("class-wizard")).toHaveTextContent("day");
    await user.click(screen.getByRole("button", { name: "close-wizard" }));
    expect(screen.queryByTestId("class-wizard")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "buy-month" }));
    expect(screen.getByTestId("class-wizard")).toHaveTextContent("month");
    await user.click(screen.getByRole("button", { name: "close-wizard" }));

    await user.click(screen.getByRole("button", { name: "cart-checkout" }));
    expect(screen.getByTestId("class-wizard")).toHaveTextContent("cart");
    await user.click(screen.getByRole("button", { name: "hero-back" }));
    expect(screen.getByTestId("busy")).toHaveTextContent(/upcoming events/i);
  });

  it("hides class hero price when no priced sessions exist", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        price: null,
        sessions: [makeClassSession({ price: 0 })],
      }),
    );
    renderWithProviders(<OnComingEventDetailPage slug={FIXTURE_EVENT_SLUG} />);
    await screen.findByRole("heading", { name: "Weekly Bachata" });
    expect(screen.queryByTestId("hero-price")).not.toBeInTheDocument();
  });

  it("renders a sold-out fixed ticket event with inventory and countdown", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        purchaseMode: "fixed_ticket",
        description: "",
        price: 45,
        ticketsRemaining: 0,
        fixedTicketCapacity: 100,
        ticketsSold: 100,
        eventStartsAt: "2030-08-01T20:00:00.000Z",
        sessions: [],
        monthPackage: makeMonthPackage({ purchasable: false }),
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<OnComingEventDetailPage slug="gala" />);
    expect(await screen.findByTestId("ticket-inventory")).toHaveTextContent("sold-out");
    expect(screen.getByTestId("countdown")).toBeInTheDocument();
    expect(screen.getByText(/all tickets have been sold/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "buy-ticket" }));
    expect(screen.getByRole("button", { name: "close-ticket" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-ticket" }));
    expect(screen.queryByRole("button", { name: "close-ticket" })).not.toBeInTheDocument();
  });

  it("renders venue seating inventory and table sold-out copy", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        purchaseMode: "venue_seating",
        price: 250,
        tableCapacity: 10,
        tablesRemaining: 0,
        tablesSold: 10,
        eventStartsAt: "2030-08-01T20:00:00.000Z",
        sessions: [],
      }),
    );
    renderWithProviders(<OnComingEventDetailPage slug="gala" />);
    expect(await screen.findByTestId("table-inventory")).toHaveTextContent("sold-out");
    expect(screen.getByTestId("countdown")).toBeInTheDocument();
    expect(screen.getByText(/all tables have been sold/i)).toBeInTheDocument();
    expect(screen.getByTestId("hero-price")).toHaveTextContent(/USD/);
  });

  it("renders table inventory without a countdown when remaining is omitted", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        purchaseMode: "venue_seating",
        price: NaN,
        tableCapacity: 8,
        tablesRemaining: undefined,
        tablesSold: 1,
        eventStartsAt: undefined,
        sessions: [],
      }),
    );
    renderWithProviders(<OnComingEventDetailPage slug="gala" />);
    expect(await screen.findByTestId("table-inventory")).toHaveTextContent("in-stock");
    expect(screen.queryByTestId("countdown")).not.toBeInTheDocument();
  });

  it("falls back to ticket capacity when remaining is omitted", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        purchaseMode: "fixed_ticket",
        description: "Sold soon",
        price: 45,
        ticketsRemaining: undefined,
        fixedTicketCapacity: 50,
        ticketsSold: 0,
        eventStartsAt: "2030-08-01T20:00:00.000Z",
        sessions: [],
        monthPackage: makeMonthPackage({ purchasable: false }),
      }),
    );
    renderWithProviders(<OnComingEventDetailPage slug="gala" />);
    expect(await screen.findByTestId("ticket-inventory")).toHaveTextContent("in-stock");
    expect(screen.getByTestId("countdown")).toBeInTheDocument();
    expect(screen.queryByText(/all tickets have been sold/i)).not.toBeInTheDocument();
  });

  it("hides purchase chrome when the mode is none", async () => {
    fetchDetailMock.mockResolvedValue(
      makeOnComingEventDetail({
        purchaseMode: "none",
        price: null,
        sessions: [],
        monthPackage: undefined,
      }),
    );
    renderWithProviders(<OnComingEventDetailPage slug={FIXTURE_EVENT_SLUG} />);
    await screen.findByRole("heading", { name: "Weekly Bachata" });
    expect(screen.queryByTestId("purchase-bar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("hero-price")).not.toBeInTheDocument();
  });

  it("shows an error state and starts leaving on back", async () => {
    const user = userEvent.setup();
    fetchDetailMock.mockRejectedValue(new Error("missing"));
    renderWithProviders(<OnComingEventDetailPage slug="missing" />);
    expect(
      await screen.findByText(/this event could not be found/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: /all on coming events/i }));
    expect(screen.getByTestId("busy")).toHaveTextContent(/upcoming events/i);
  });

  it("starts leaving from the error back button", async () => {
    const user = userEvent.setup();
    fetchDetailMock.mockRejectedValue(new Error("missing"));
    renderWithProviders(<OnComingEventDetailPage slug="missing" />);
    expect(
      await screen.findByText(/this event could not be found/i),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back-/i }));
    expect(screen.getByTestId("busy")).toHaveTextContent(/upcoming events/i);
  });
});
