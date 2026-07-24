/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeOccasionTypeItem } from "../test/fixtures/occasionTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/data-display", () => ({
  EmptyState: ({
    title,
    action,
  }: {
    title: string;
    action?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      {action ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  ),
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("./OccasionTypesTable", () => ({
  default: () => <div data-testid="table" />,
}));

vi.mock("./OccasionTypesMobileCard", () => ({
  default: ({ item }: { item: { name: string } }) => (
    <div data-testid={`mobile-${item.name}`} />
  ),
}));

import OccasionTypesListSection from "./OccasionTypesListSection";

function renderList(
  overrides: Partial<React.ComponentProps<typeof OccasionTypesListSection>> = {},
) {
  const rows = [makeOccasionTypeItem()];
  const props: React.ComponentProps<typeof OccasionTypesListSection> = {
    isLoading: false,
    rowsCount: 1,
    filteredCount: 1,
    pagedRows: rows,
    paginationMeta: {
      page: 1,
      perPage: 10,
      totalItems: 1,
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
  return {
    ...renderWithProviders(<OccasionTypesListSection {...props} />),
    props,
  };
}

describe("OccasionTypesListSection", () => {
  it("renders table and mobile cards", () => {
    renderList();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-Birthday")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows Loading", () => {
    renderList({ isLoading: true, filteredCount: 0, pagedRows: [] });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty catalog state with create action", async () => {
    const user = userEvent.setup();
    const { props } = renderList({
      rowsCount: 0,
      filteredCount: 0,
      pagedRows: [],
    });
    expect(screen.getByText("No occasion types yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Create occasion type" }));
    expect(props.onCreateClick).toHaveBeenCalled();
  });

  it("shows no-match empty state", () => {
    renderList({ rowsCount: 2, filteredCount: 0, pagedRows: [] });
    expect(screen.getByText("No matches for your search")).toBeInTheDocument();
  });
});
