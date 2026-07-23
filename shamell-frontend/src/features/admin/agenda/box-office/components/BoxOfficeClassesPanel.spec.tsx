/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import {
  makeBoxOfficeClassContext,
  makeBoxOfficeClassEventOption,
  makeDaySectionOffer,
} from "../test/fixtures/boxOffice.fixture";
import { FIXTURE_CLASS_EVENT_ID } from "../test/fixtures/uuids.fixture";

const useBoxOfficeClassesFormMock = vi.fn();

vi.mock("../hooks/useBoxOfficeClassesForm", () => ({
  useBoxOfficeClassesForm: () => useBoxOfficeClassesFormMock(),
}));

import { BoxOfficeClassesPanel } from "./BoxOfficeClassesPanel";

function makeForm(overrides: Record<string, unknown> = {}) {
  return {
    events: [] as ReturnType<typeof makeBoxOfficeClassEventOption>[],
    eventsLoading: false,
    eventsError: null as string | null,
    eventId: "",
    onSelectEvent: vi.fn(),
    context: null as ReturnType<typeof makeBoxOfficeClassContext> | null,
    contextLoading: false,
    contextError: null as string | null,
    bookingKind: "day" as const,
    setBookingKind: vi.fn(),
    weekday: null as number | null,
    selectedDateIso: null as string | null,
    selectedSessionIds: new Set<string>(),
    toggleSessionId: vi.fn(),
    monthIso: null as string | null,
    setMonthIso: vi.fn(),
    days: [] as Array<{ weekday: number; label: string; sections: unknown[] }>,
    monthPackage: null as ReturnType<typeof makeBoxOfficeClassContext>["monthPackage"] | null,
    hasMonthPackage: false,
    contextBookable: false,
    setupIssues: [] as string[],
    sectionOffers: [] as ReturnType<typeof makeDaySectionOffer>[],
    monthPreview: null as { monthLabel: string; sessionCount: number } | null,
    displayTotal: null as number | null,
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
    onSelectWeekday: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    ...overrides,
  };
}

describe("BoxOfficeClassesPanel", () => {
  beforeEach(() => {
    useBoxOfficeClassesFormMock.mockReset();
  });

  it("shows a spinner while events are loading", () => {
    useBoxOfficeClassesFormMock.mockReturnValue(
      makeForm({ eventsLoading: true }),
    );
    const { container } = renderWithProviders(<BoxOfficeClassesPanel />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows an empty state when there are no bookable class events", () => {
    useBoxOfficeClassesFormMock.mockReturnValue(makeForm());
    renderWithProviders(<BoxOfficeClassesPanel />);
    expect(
      screen.getByText(/no bookable class events yet/i),
    ).toBeInTheDocument();
  });

  it("renders the bookable form with weekday chips, sections and total", () => {
    const context = makeBoxOfficeClassContext();
    const days =
      context.schedule?.mode === "RECURRING_WEEKLY" ? context.schedule.days : [];
    useBoxOfficeClassesFormMock.mockReturnValue(
      makeForm({
        events: [makeBoxOfficeClassEventOption()],
        eventId: FIXTURE_CLASS_EVENT_ID,
        context,
        contextBookable: true,
        days,
        hasMonthPackage: true,
        monthPackage: context.monthPackage,
        weekday: 5,
        selectedDateIso: "2030-03-15",
        sectionOffers: [makeDaySectionOffer()],
        selectedSessionIds: new Set([makeDaySectionOffer().sessionId as string]),
        displayTotal: 30,
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
      }),
    );
    renderWithProviders(<BoxOfficeClassesPanel />);

    expect(screen.getByText("CLASS EVENT")).toBeInTheDocument();
    expect(screen.getByText("BOOKING TYPE")).toBeInTheDocument();
    expect(screen.getByText(/day drop-in/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Friday" })).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
    expect(screen.getAllByText("$30").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe");
    expect(
      screen.getByRole("button", { name: /confirm class reservation/i }),
    ).toBeInTheDocument();
  });

  it("shows the not-ready notice when the class event is not bookable", () => {
    const context = makeBoxOfficeClassContext({
      readiness: { isBookable: false, reasons: ["no_sessions"] },
    });
    useBoxOfficeClassesFormMock.mockReturnValue(
      makeForm({
        events: [makeBoxOfficeClassEventOption()],
        eventId: FIXTURE_CLASS_EVENT_ID,
        context,
        contextBookable: false,
        setupIssues: ["No upcoming sessions with available seats."],
      }),
    );
    renderWithProviders(<BoxOfficeClassesPanel />);

    expect(screen.getByText("CLASS EVENT NOT READY")).toBeInTheDocument();
    expect(
      screen.getByText("No upcoming sessions with available seats."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });
});
