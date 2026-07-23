/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminService } from "../test/fixtures/services.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./ServicesTable", () => ({
  default: () => <div data-testid="services-table" />,
}));

vi.mock("./ServicesMobileCard", () => ({
  default: () => <div data-testid="services-mobile-card" />,
}));

vi.mock("./ServicesPagination", () => ({
  default: ({
    safePage,
    onPageChange,
  }: {
    safePage: number;
    onPageChange: (page: number) => void;
  }) => (
    <div data-testid="services-pagination">
      <button type="button" onClick={() => onPageChange(safePage + 1)}>
        stub-next-page
      </button>
    </div>
  ),
}));

import ServicesListSection from "./ServicesListSection";

function renderSection(
  overrides: Partial<React.ComponentProps<typeof ServicesListSection>> = {},
) {
  const services = [makeAdminService()];
  const props: React.ComponentProps<typeof ServicesListSection> = {
    isLoading: false,
    filteredServices: services,
    paginatedServices: services,
    pageOffset: 0,
    safePage: 1,
    totalPages: 2,
    onPageChange: vi.fn(),
    togglingId: null,
    cannotDeactivate: () => false,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onToggle: vi.fn(),
    onBlockedDeactivate: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<ServicesListSection {...props} />), props };
}

describe("ServicesListSection", () => {
  it("shows Loading... while empty and loading", () => {
    renderSection({
      isLoading: true,
      filteredServices: [],
      paginatedServices: [],
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty copy when there are no services", () => {
    renderSection({
      isLoading: false,
      filteredServices: [],
      paginatedServices: [],
    });
    expect(screen.getByText("No services to show.")).toBeInTheDocument();
  });

  it("renders table and mobile card stubs with pagination", () => {
    renderSection();
    expect(screen.getByTestId("services-table")).toBeInTheDocument();
    expect(screen.getByTestId("services-mobile-card")).toBeInTheDocument();
    expect(screen.getByTestId("services-pagination")).toBeInTheDocument();
  });

  it("forwards page changes from pagination", async () => {
    const user = userEvent.setup();
    const { props } = renderSection({ safePage: 1, totalPages: 3 });

    await user.click(screen.getByRole("button", { name: "stub-next-page" }));
    expect(props.onPageChange).toHaveBeenCalledWith(2);
  });
});
