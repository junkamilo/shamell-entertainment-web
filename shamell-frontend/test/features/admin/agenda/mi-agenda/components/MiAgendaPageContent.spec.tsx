/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockMiAgendaPageState } from "@test/features/admin/agenda/mi-agenda/support/helpers/mockMiAgendaPage";
import { renderWithProviders } from "@test/features/admin/agenda/mi-agenda/support/helpers/renderWithProviders";

let pageState = createMockMiAgendaPageState();

vi.mock("@/features/admin/agenda/mi-agenda/hooks/useMiAgendaPage", () => ({
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

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaCalendarToolbar", () => ({
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

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaDayView", () => ({
  default: () => <div data-testid="day-view" />,
}));

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaWeekView", () => ({
  default: () => <div data-testid="week-view" />,
}));

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaMonthView", () => ({
  default: () => <div data-testid="month-view" />,
}));

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaEventDetailsPanel", () => ({
  default: () => <div data-testid="details-panel" />,
}));

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaCancelModal", () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="cancel-modal" /> : null,
}));

import MiAgendaPageContent from "@/features/admin/agenda/mi-agenda/components/MiAgendaPageContent";

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
