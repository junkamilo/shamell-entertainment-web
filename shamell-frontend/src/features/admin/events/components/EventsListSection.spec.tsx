/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./EventsTable", () => ({
  default: ({
    events,
    onView,
    onEdit,
    onDelete,
    onToggleActive,
    onBlockedDeactivate,
  }: {
    events: { id: string }[];
    onView: (item: { id: string }) => void;
    onEdit: (item: { id: string }) => void;
    onDelete: (item: { id: string }) => void;
    onToggleActive: (item: { id: string }) => void;
    onBlockedDeactivate: (item: { id: string }) => void;
  }) => (
    <div data-testid="events-table">
      {events.map((item) => (
        <div key={item.id}>
          <button type="button" onClick={() => onView(item)}>
            table-view
          </button>
          <button type="button" onClick={() => onEdit(item)}>
            table-edit
          </button>
          <button type="button" onClick={() => onDelete(item)}>
            table-delete
          </button>
          <button type="button" onClick={() => onToggleActive(item)}>
            table-toggle
          </button>
          <button type="button" onClick={() => onBlockedDeactivate(item)}>
            table-blocked
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("./EventsMobileCard", () => ({
  default: ({
    deactivateBlocked,
    onView,
    onEdit,
    onDelete,
    onToggleActive,
    onBlockedDeactivate,
  }: {
    item: { id: string };
    deactivateBlocked: boolean;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
    onBlockedDeactivate: () => void;
  }) => (
    <div data-testid="events-mobile-card" data-blocked={String(deactivateBlocked)}>
      <button type="button" onClick={onView}>
        mobile-view
      </button>
      <button type="button" onClick={onEdit}>
        mobile-edit
      </button>
      <button type="button" onClick={onDelete}>
        mobile-delete
      </button>
      <button type="button" onClick={onToggleActive}>
        mobile-toggle
      </button>
      <button type="button" onClick={onBlockedDeactivate}>
        mobile-blocked
      </button>
    </div>
  ),
}));

vi.mock("./EventsPagination", () => ({
  default: ({ onPageChange }: { onPageChange: (page: number) => void }) => (
    <div data-testid="events-pagination">
      <button type="button" onClick={() => onPageChange(2)}>
        page-2
      </button>
    </div>
  ),
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

  it("shows Refreshing... when loading with existing results", () => {
    renderSection({ isLoading: true });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    expect(screen.getByText("Refreshing...")).toBeInTheDocument();
    expect(screen.getByTestId("events-pagination")).toBeInTheDocument();
    expect(screen.queryByTestId("events-table")).not.toBeInTheDocument();
  });

  it("wires mobile card handlers and deactivateBlocked", async () => {
    const user = userEvent.setup();
    const event = makeAdminEvent();
    const cannotDeactivate = vi.fn(() => true);
    const { props } = renderSection({
      paginatedEvents: [event],
      cannotDeactivate,
    });

    expect(cannotDeactivate).toHaveBeenCalledWith(event);
    expect(screen.getByTestId("events-mobile-card")).toHaveAttribute(
      "data-blocked",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "mobile-view" }));
    expect(props.onView).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "mobile-edit" }));
    expect(props.onEdit).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "mobile-delete" }));
    expect(props.onDelete).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "mobile-toggle" }));
    expect(props.onToggleActive).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "mobile-blocked" }));
    expect(props.onBlockedDeactivate).toHaveBeenCalledWith(event);
  });

  it("wires table row handlers", async () => {
    const user = userEvent.setup();
    const event = makeAdminEvent();
    const { props } = renderSection({ paginatedEvents: [event] });

    await user.click(screen.getByRole("button", { name: "table-view" }));
    expect(props.onView).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "table-edit" }));
    expect(props.onEdit).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "table-delete" }));
    expect(props.onDelete).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "table-toggle" }));
    expect(props.onToggleActive).toHaveBeenCalledWith(event);
    await user.click(screen.getByRole("button", { name: "table-blocked" }));
    expect(props.onBlockedDeactivate).toHaveBeenCalledWith(event);
  });

  it("changes page from pagination", async () => {
    const user = userEvent.setup();
    const { props } = renderSection();
    await user.click(screen.getByRole("button", { name: "page-2" }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });
});
