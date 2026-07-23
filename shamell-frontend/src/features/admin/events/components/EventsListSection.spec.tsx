/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./EventsTable", () => ({
  default: () => <div data-testid="events-table" />,
}));

vi.mock("./EventsMobileCard", () => ({
  default: () => <div data-testid="events-mobile-card" />,
}));

vi.mock("./EventsPagination", () => ({
  default: () => <div data-testid="events-pagination" />,
}));

vi.mock("@/components/admin/data-display", () => ({
  EmptyState: ({
    title,
    action,
  }: {
    title: string;
    action?: { label: string; onClick?: () => void };
  }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      {action?.onClick ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  ),
}));

import EventsListSection from "./EventsListSection";

function renderSection(
  overrides: Partial<React.ComponentProps<typeof EventsListSection>> = {},
) {
  const events = [makeAdminEvent()];
  const props: React.ComponentProps<typeof EventsListSection> = {
    isLoading: false,
    sectionEventsCount: events.length,
    searchedCount: events.length,
    paginatedEvents: events,
    pageOffset: 0,
    safePage: 1,
    totalPages: 1,
    onPageChange: vi.fn(),
    onCreateClick: vi.fn(),
    togglingId: null,
    cannotDeactivate: () => false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventsListSection {...props} />), props };
}

describe("EventsListSection", () => {
  it("shows Loading... while loading", () => {
    renderSection({
      isLoading: true,
      sectionEventsCount: 0,
      searchedCount: 0,
      paginatedEvents: [],
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty catalog when there are no events", () => {
    renderSection({
      isLoading: false,
      sectionEventsCount: 0,
      searchedCount: 0,
      paginatedEvents: [],
    });
    expect(screen.getByText("No events yet")).toBeInTheDocument();
  });

  it("shows no-matches empty when search yields nothing", () => {
    renderSection({
      isLoading: false,
      sectionEventsCount: 2,
      searchedCount: 0,
      paginatedEvents: [],
    });
    expect(screen.getByText("No matches for your search")).toBeInTheDocument();
  });

  it("renders table, mobile card, and pagination stubs with results", () => {
    renderSection();
    expect(screen.getByTestId("events-table")).toBeInTheDocument();
    expect(screen.getByTestId("events-mobile-card")).toBeInTheDocument();
    expect(screen.getByTestId("events-pagination")).toBeInTheDocument();
  });

  it("calls onCreateClick from empty catalog action", async () => {
    const user = userEvent.setup();
    const { props } = renderSection({
      isLoading: false,
      sectionEventsCount: 0,
      searchedCount: 0,
      paginatedEvents: [],
    });

    await user.click(screen.getByRole("button", { name: "New event" }));
    expect(props.onCreateClick).toHaveBeenCalledOnce();
  });
});
