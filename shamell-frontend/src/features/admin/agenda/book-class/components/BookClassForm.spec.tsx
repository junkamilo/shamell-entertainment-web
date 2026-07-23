/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockBookClassFormState } from "../test/helpers/mockBookClassFormState";
import {
  makeBookClassEventContext,
  makeBookClassEventOption,
  makeMonthPackageOffer,
} from "../test/fixtures/bookClass.fixture";
import {
  FIXTURE_CLASS_EVENT_ID,
  FIXTURE_SECTION_ID,
  FIXTURE_SESSION_ID,
} from "../test/fixtures/uuids.fixture";
import type { DaySectionOffer } from "@/features/on-coming-events/lib/buildDaySectionOffers";

const useBookClassPageMock = vi.fn();

vi.mock("../hooks/useBookClassPage", () => ({
  useBookClassPage: () => useBookClassPageMock(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { BookClassForm } from "./BookClassForm";

const sampleOffer: DaySectionOffer = {
  sectionId: FIXTURE_SECTION_ID,
  label: "Beginner",
  startTime: "18:00",
  endTime: "19:00",
  sortOrder: 0,
  sessionId: FIXTURE_SESSION_ID,
  price: 45,
  capacity: 20,
  seatsSold: 8,
  seatsRemaining: 12,
  available: true,
};

function makePage(overrides: Record<string, unknown> = {}) {
  const form = createMockBookClassFormState({
    eventId: FIXTURE_CLASS_EVENT_ID,
    weekday: 5,
    selectedDateIso: "2030-03-15",
    selectedSessionIds: new Set([FIXTURE_SESSION_ID]),
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
  });
  const context = makeBookClassEventContext();
  const monthPackage = makeMonthPackageOffer();

  return {
    form,
    catalog: {
      eventsLoading: false,
      contextLoading: false,
      events: [makeBookClassEventOption()],
      context,
      error: null,
      hasBookableEvents: true,
      loadContext: vi.fn(),
    },
    days: context.schedule?.mode === "RECURRING_WEEKLY" ? context.schedule.days : [],
    timezone: "America/New_York",
    monthPackage,
    hasMonthPackage: true,
    contextBookable: true,
    setupIssues: [],
    sectionOffers: [sampleOffer],
    monthPreview: {
      monthLabel: "March 2030",
      sessionCount: 4,
    },
    displayTotal: 45,
    submitting: false,
    onSelectWeekday: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    ...overrides,
  };
}

describe("BookClassForm", () => {
  beforeEach(() => {
    useBookClassPageMock.mockReset();
  });

  it("shows a spinner while events load", () => {
    useBookClassPageMock.mockReturnValue(
      makePage({
        catalog: {
          eventsLoading: true,
          contextLoading: false,
          events: [],
          context: null,
          error: null,
          hasBookableEvents: false,
          loadContext: vi.fn(),
        },
      }),
    );
    const { container } = renderWithProviders(<BookClassForm />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows empty state when there are no bookable events", () => {
    useBookClassPageMock.mockReturnValue(
      makePage({
        catalog: {
          eventsLoading: false,
          contextLoading: false,
          events: [],
          context: null,
          error: null,
          hasBookableEvents: false,
          loadContext: vi.fn(),
        },
      }),
    );
    renderWithProviders(<BookClassForm />);
    expect(screen.getByText(/no bookable class schedule yet/i)).toBeInTheDocument();
  });

  it("renders bookable form fields and submit label", () => {
    useBookClassPageMock.mockReturnValue(makePage());
    renderWithProviders(<BookClassForm />);

    expect(screen.getByText("CLASS EVENT")).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("Jane Doe");
    expect(screen.getByLabelText(/^email$/i)).toHaveValue("jane@example.com");
    expect(screen.getByRole("button", { name: /send payment link/i })).toBeEnabled();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
  });

  it("shows setup notice when the selected event is not bookable", () => {
    useBookClassPageMock.mockReturnValue(
      makePage({
        contextBookable: false,
        setupIssues: ["No upcoming sessions with available seats."],
      }),
    );
    renderWithProviders(<BookClassForm />);
    expect(screen.getByText(/this class event is not ready to book/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
  });

  it("changes event and resets dependent fields", async () => {
    const user = userEvent.setup();
    const page = makePage();
    useBookClassPageMock.mockReturnValue(page);
    renderWithProviders(<BookClassForm />);

    await user.selectOptions(screen.getByRole("combobox"), FIXTURE_CLASS_EVENT_ID);
    expect(page.form.setEventId).toHaveBeenCalledWith(FIXTURE_CLASS_EVENT_ID);
    expect(page.form.resetForEventChange).toHaveBeenCalled();
  });

  it("selects a weekday via CLASS DAY chips", async () => {
    const user = userEvent.setup();
    const page = makePage();
    useBookClassPageMock.mockReturnValue(page);
    renderWithProviders(<BookClassForm />);

    await user.click(screen.getByRole("button", { name: /friday/i }));
    expect(page.onSelectWeekday).toHaveBeenCalledWith(5);
  });

  it("toggles a section offer", async () => {
    const user = userEvent.setup();
    const page = makePage({
      form: createMockBookClassFormState({
        eventId: FIXTURE_CLASS_EVENT_ID,
        weekday: 5,
        selectedDateIso: "2030-03-15",
        selectedSessionIds: new Set(),
      }),
    });
    useBookClassPageMock.mockReturnValue(page);
    renderWithProviders(<BookClassForm />);

    await user.click(screen.getByRole("button", { name: /beginner/i }));
    expect(page.form.toggleSessionId).toHaveBeenCalledWith(FIXTURE_SESSION_ID);
  });

  it("shows cash confirmation and reservation CTA", async () => {
    const user = userEvent.setup();
    const page = makePage({
      form: createMockBookClassFormState({
        eventId: FIXTURE_CLASS_EVENT_ID,
        weekday: 5,
        selectedDateIso: "2030-03-15",
        selectedSessionIds: new Set([FIXTURE_SESSION_ID]),
        paymentMethod: "cash",
        cashConfirmed: false,
        customerName: "Jane",
        customerEmail: "jane@example.com",
      }),
    });
    useBookClassPageMock.mockReturnValue(page);
    renderWithProviders(<BookClassForm />);

    expect(
      screen.getByRole("button", { name: /confirm class reservation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/i confirm cash payment was received/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox"));
    expect(page.form.setCashConfirmed).toHaveBeenCalledWith(true);
  });

  it("disables submit while processing", () => {
    useBookClassPageMock.mockReturnValue(makePage({ submitting: true }));
    renderWithProviders(<BookClassForm />);
    expect(screen.getByRole("button", { name: /processing/i })).toBeDisabled();
  });

  it("calls onSubmit when the payment CTA is clicked", async () => {
    const user = userEvent.setup();
    const page = makePage();
    useBookClassPageMock.mockReturnValue(page);
    renderWithProviders(<BookClassForm />);

    await user.click(screen.getByRole("button", { name: /send payment link/i }));
    expect(page.onSubmit).toHaveBeenCalledOnce();
  });
});
