/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import {
  makeFixedTicketEvent,
  makeVenueFixedEvent,
} from "../test/fixtures/boxOffice.fixture";
import { FIXTURE_FIXED_EVENT_ID } from "../test/fixtures/uuids.fixture";

const useBoxOfficeFixedEventFormMock = vi.fn();

vi.mock("../hooks/useBoxOfficeFixedEventForm", () => ({
  useBoxOfficeFixedEventForm: () => useBoxOfficeFixedEventFormMock(),
}));

import { BoxOfficeFixedEventPanel } from "./BoxOfficeFixedEventPanel";

function makeForm(overrides: Record<string, unknown> = {}) {
  return {
    events: [] as ReturnType<typeof makeFixedTicketEvent>[],
    eventsLoading: false,
    eventsError: null as string | null,
    eventId: "",
    onSelectEvent: vi.fn(),
    selectedEvent: null as ReturnType<typeof makeFixedTicketEvent> | null,
    seats: [],
    seatsLoading: false,
    selectedSeatId: null,
    setSelectedSeatId: vi.fn(),
    selectedSeat: null,
    customerName: "",
    setCustomerName: vi.fn(),
    customerEmail: "",
    setCustomerEmail: vi.fn(),
    customerPhone: "",
    setCustomerPhone: vi.fn(),
    paymentMethod: "cash" as const,
    setPaymentMethod: vi.fn(),
    cashConfirmed: false,
    setCashConfirmed: vi.fn(),
    submitting: false,
    formError: null as string | null,
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    ...overrides,
  };
}

describe("BoxOfficeFixedEventPanel", () => {
  beforeEach(() => {
    useBoxOfficeFixedEventFormMock.mockReset();
  });

  it("shows a spinner while events are loading", () => {
    useBoxOfficeFixedEventFormMock.mockReturnValue(
      makeForm({ eventsLoading: true }),
    );
    const { container } = renderWithProviders(<BoxOfficeFixedEventPanel />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows an empty state when there are no Box Office events", () => {
    useBoxOfficeFixedEventFormMock.mockReturnValue(makeForm());
    renderWithProviders(<BoxOfficeFixedEventPanel />);
    expect(
      screen.getByText(/no fixed event or seating on coming events/i),
    ).toBeInTheDocument();
  });

  it("renders the guest form and ticket summary for a fixed-ticket event", () => {
    const fixedEvent = makeFixedTicketEvent();
    useBoxOfficeFixedEventFormMock.mockReturnValue(
      makeForm({
        events: [fixedEvent],
        eventId: FIXTURE_FIXED_EVENT_ID,
        selectedEvent: fixedEvent,
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
      }),
    );
    renderWithProviders(<BoxOfficeFixedEventPanel />);

    expect(screen.getByText("ON COMING EVENT")).toBeInTheDocument();
    expect(screen.getAllByText(fixedEvent.name).length).toBeGreaterThan(0);
    expect(screen.getByText(/\$45/)).toBeInTheDocument();
    expect(screen.getByText(/remaining: 12/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe");
    expect(
      screen.getByRole("button", { name: /confirm ticket reservation/i }),
    ).toBeInTheDocument();
  });

  it("shows the seat picker and venue-seating submit label for a venue event", () => {
    const venueEvent = makeVenueFixedEvent();
    useBoxOfficeFixedEventFormMock.mockReturnValue(
      makeForm({
        events: [venueEvent],
        eventId: venueEvent.id,
        selectedEvent: venueEvent,
      }),
    );
    renderWithProviders(<BoxOfficeFixedEventPanel />);

    expect(screen.getByText("TABLES & CHAIRS")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm seat reservation/i }),
    ).toBeInTheDocument();
  });

  it("shows the API error message and disables the button while submitting", () => {
    const fixedEvent = makeFixedTicketEvent();
    useBoxOfficeFixedEventFormMock.mockReturnValue(
      makeForm({
        events: [fixedEvent],
        eventId: FIXTURE_FIXED_EVENT_ID,
        selectedEvent: fixedEvent,
        formError: "Something went wrong.",
        submitting: true,
      }),
    );
    renderWithProviders(<BoxOfficeFixedEventPanel />);

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
  });
});
