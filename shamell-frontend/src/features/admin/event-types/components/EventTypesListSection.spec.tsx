/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeEventTypeItem } from "../test/fixtures/eventTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./EventTypesTable", () => ({
  default: () => <div data-testid="event-types-table" />,
}));

vi.mock("./EventTypesMobileCard", () => ({
  default: () => <div data-testid="event-types-mobile-card" />,
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
  Pagination: () => <div data-testid="event-types-pagination" />,
}));

import EventTypesListSection from "./EventTypesListSection";

function renderSection(
  overrides: Partial<React.ComponentProps<typeof EventTypesListSection>> = {},
) {
  const types = [makeEventTypeItem()];
  const props: React.ComponentProps<typeof EventTypesListSection> = {
    isLoading: false,
    typesCount: types.length,
    filteredCount: types.length,
    pagedTypes: types,
    paginationMeta: {
      page: 1,
      perPage: 10,
      totalItems: types.length,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    onPageChange: vi.fn(),
    onPerPageChange: vi.fn(),
    onCreateClick: vi.fn(),
    togglingId: null,
    cannotDeactivate: () => false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<EventTypesListSection {...props} />), props };
}

describe("EventTypesListSection", () => {
  it("shows Loading... while loading", () => {
    renderSection({
      isLoading: true,
      typesCount: 0,
      filteredCount: 0,
      pagedTypes: [],
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty catalog when there are no event types", () => {
    renderSection({
      isLoading: false,
      typesCount: 0,
      filteredCount: 0,
      pagedTypes: [],
    });
    expect(screen.getByText("No event types yet")).toBeInTheDocument();
  });

  it("shows no-matches empty when filters yield nothing", () => {
    renderSection({
      isLoading: false,
      typesCount: 2,
      filteredCount: 0,
      pagedTypes: [],
    });
    expect(screen.getByText("No matches for your search")).toBeInTheDocument();
  });

  it("renders table and mobile card stubs with pagination", () => {
    renderSection();
    expect(screen.getByTestId("event-types-table")).toBeInTheDocument();
    expect(screen.getByTestId("event-types-mobile-card")).toBeInTheDocument();
    expect(screen.getByTestId("event-types-pagination")).toBeInTheDocument();
  });

  it("calls onCreateClick from empty catalog action", async () => {
    const user = userEvent.setup();
    const { props } = renderSection({
      isLoading: false,
      typesCount: 0,
      filteredCount: 0,
      pagedTypes: [],
    });

    await user.click(screen.getByRole("button", { name: "Create event type" }));
    expect(props.onCreateClick).toHaveBeenCalledOnce();
  });
});
