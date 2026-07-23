/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockMiAgendaPageState } from "../test/helpers/mockMiAgendaPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

let pageState = createMockMiAgendaPageState();

vi.mock("../hooks/useMiAgendaPage", () => ({
  useMiAgendaPage: () => pageState,
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

vi.mock("./MiAgendaCalendarToolbar", () => ({
  default: ({
    onViewModeChange,
  }: {
    onViewModeChange: (mode: string) => void;
  }) => (
    <button type="button" onClick={() => onViewModeChange("day")}>
      stub-toolbar
    </button>
  ),
}));

vi.mock("./MiAgendaDayView", () => ({
  default: () => <div data-testid="day-view" />,
}));

vi.mock("./MiAgendaWeekView", () => ({
  default: () => <div data-testid="week-view" />,
}));

vi.mock("./MiAgendaMonthView", () => ({
  default: () => <div data-testid="month-view" />,
}));

vi.mock("./MiAgendaEventDetailsPanel", () => ({
  default: () => <div data-testid="details-panel" />,
}));

vi.mock("./MiAgendaCancelModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="cancel-modal" /> : null,
}));

import MiAgendaPageContent from "./MiAgendaPageContent";

describe("MiAgendaPageContent", () => {
  beforeEach(() => {
    pageState = createMockMiAgendaPageState();
  });

  it("renders back link, hero, and week view by default", () => {
    renderWithProviders(<MiAgendaPageContent />);
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/admin/agenda",
    );
    expect(screen.getByRole("heading", { name: /my calendar/i })).toBeInTheDocument();
    expect(screen.getByTestId("week-view")).toBeInTheDocument();
    expect(screen.getByTestId("details-panel")).toBeInTheDocument();
  });

  it("switches to day and month views", () => {
    pageState = createMockMiAgendaPageState({
      calendar: {
        ...createMockMiAgendaPageState().calendar,
        viewMode: "day",
      },
    });
    const { rerender } = renderWithProviders(<MiAgendaPageContent />);
    expect(screen.getByTestId("day-view")).toBeInTheDocument();

    pageState = createMockMiAgendaPageState({
      calendar: {
        ...createMockMiAgendaPageState().calendar,
        viewMode: "month",
      },
    });
    rerender(<MiAgendaPageContent />);
    expect(screen.getByTestId("month-view")).toBeInTheDocument();
  });

  it("shows booking error and loading copy", () => {
    pageState = createMockMiAgendaPageState({
      bookings: {
        ...createMockMiAgendaPageState().bookings,
        error: "Could not load",
        isLoading: true,
      },
    });
    renderWithProviders(<MiAgendaPageContent />);
    expect(screen.getByText("Could not load")).toBeInTheDocument();
    expect(screen.getByText("Loading calendar...")).toBeInTheDocument();
  });

  it("wires toolbar view mode changes", async () => {
    const user = userEvent.setup();
    renderWithProviders(<MiAgendaPageContent />);
    await user.click(screen.getByRole("button", { name: "stub-toolbar" }));
    expect(pageState.calendar.setViewMode).toHaveBeenCalledWith("day");
  });

  it("shows cancel modal when open", () => {
    pageState = createMockMiAgendaPageState({ cancelModalOpen: true });
    renderWithProviders(<MiAgendaPageContent />);
    expect(screen.getByTestId("cancel-modal")).toBeInTheDocument();
  });
});
