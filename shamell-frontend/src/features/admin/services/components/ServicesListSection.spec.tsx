/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminService } from "../test/fixtures/services.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./ServicesTable", () => ({
  default: ({
    services,
    onView,
    onEdit,
    onDelete,
    onToggle,
    onBlockedDeactivate,
  }: {
    services: { id: string }[];
    onView: (item: { id: string }) => void;
    onEdit: (item: { id: string }) => void;
    onDelete: (item: { id: string }) => void;
    onToggle: (item: { id: string }) => void;
    onBlockedDeactivate: (item: { id: string }) => void;
  }) => (
    <div data-testid="services-table">
      {services.map((item) => (
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
          <button type="button" onClick={() => onToggle(item)}>
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

vi.mock("./ServicesMobileCard", () => ({
  default: ({
    deactivateBlocked,
    onView,
    onEdit,
    onDelete,
    onToggle,
    onBlockedDeactivate,
  }: {
    service: { id: string };
    deactivateBlocked: boolean;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggle: () => void;
    onBlockedDeactivate: () => void;
  }) => (
    <div data-testid="services-mobile-card" data-blocked={String(deactivateBlocked)}>
      <button type="button" onClick={onView}>
        mobile-view
      </button>
      <button type="button" onClick={onEdit}>
        mobile-edit
      </button>
      <button type="button" onClick={onDelete}>
        mobile-delete
      </button>
      <button type="button" onClick={onToggle}>
        mobile-toggle
      </button>
      <button type="button" onClick={onBlockedDeactivate}>
        mobile-blocked
      </button>
    </div>
  ),
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

  it("shows Refreshing... when loading with existing results", () => {
    renderSection({ isLoading: true });
    expect(screen.getByText("Refreshing...")).toBeInTheDocument();
    expect(screen.getByTestId("services-table")).toBeInTheDocument();
    expect(screen.getByTestId("services-pagination")).toBeInTheDocument();
  });

  it("wires mobile card handlers and deactivateBlocked", async () => {
    const user = userEvent.setup();
    const service = makeAdminService();
    const cannotDeactivate = vi.fn(() => true);
    const { props } = renderSection({
      filteredServices: [service],
      paginatedServices: [service],
      cannotDeactivate,
    });

    expect(cannotDeactivate).toHaveBeenCalledWith(service);
    expect(screen.getByTestId("services-mobile-card")).toHaveAttribute(
      "data-blocked",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "mobile-view" }));
    expect(props.onView).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "mobile-edit" }));
    expect(props.onEdit).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "mobile-delete" }));
    expect(props.onDelete).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "mobile-toggle" }));
    expect(props.onToggle).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "mobile-blocked" }));
    expect(props.onBlockedDeactivate).toHaveBeenCalledWith(service);
  });

  it("wires table row handlers", async () => {
    const user = userEvent.setup();
    const service = makeAdminService();
    const { props } = renderSection({
      filteredServices: [service],
      paginatedServices: [service],
    });

    await user.click(screen.getByRole("button", { name: "table-view" }));
    expect(props.onView).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "table-edit" }));
    expect(props.onEdit).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "table-delete" }));
    expect(props.onDelete).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "table-toggle" }));
    expect(props.onToggle).toHaveBeenCalledWith(service);
    await user.click(screen.getByRole("button", { name: "table-blocked" }));
    expect(props.onBlockedDeactivate).toHaveBeenCalledWith(service);
  });
});
