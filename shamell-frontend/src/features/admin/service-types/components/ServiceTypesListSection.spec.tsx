/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { makeServiceTypeItem } from "../test/fixtures/serviceTypes.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/data-display", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("./ServiceTypesTable", () => ({
  default: () => <div data-testid="table" />,
}));

vi.mock("./ServiceTypesMobileCard", () => ({
  default: ({ item }: { item: { name: string } }) => (
    <div data-testid={`mobile-${item.name}`} />
  ),
}));

import ServiceTypesListSection from "./ServiceTypesListSection";

function renderList(
  overrides: Partial<React.ComponentProps<typeof ServiceTypesListSection>> = {},
) {
  const types = [makeServiceTypeItem()];
  const props: React.ComponentProps<typeof ServiceTypesListSection> = {
    isLoading: false,
    typesCount: 1,
    filteredCount: 1,
    pagedTypes: types,
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
    togglingId: null,
    cannotDeactivate: () => false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggleActive: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return {
    ...renderWithProviders(<ServiceTypesListSection {...props} />),
    props,
  };
}

describe("ServiceTypesListSection", () => {
  it("renders table and mobile cards", () => {
    renderList();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-Performance")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("shows Loading", () => {
    renderList({ isLoading: true, filteredCount: 0, pagedTypes: [] });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty catalog state", () => {
    renderList({
      typesCount: 0,
      filteredCount: 0,
      pagedTypes: [],
    });
    expect(screen.getByText("No service types yet.")).toBeInTheDocument();
  });

  it("shows no-match empty state", () => {
    renderList({ typesCount: 2, filteredCount: 0, pagedTypes: [] });
    expect(
      screen.getByText("Nothing matches your search or filter."),
    ).toBeInTheDocument();
  });
});
