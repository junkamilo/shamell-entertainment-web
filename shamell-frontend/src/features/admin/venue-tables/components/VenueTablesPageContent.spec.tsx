/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockVenueTablesListState } from "../test/helpers/mockVenueTablesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const mockUseVenueTablesList = vi.fn(() => createMockVenueTablesListState());

vi.mock("../hooks/useVenueTablesList", () => ({
  useVenueTablesList: () => mockUseVenueTablesList(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => "test-token",
}));

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({
    title,
    subtitle,
    actionLabel,
    onAction,
    extraActions,
  }: {
    title: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    extraActions?: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
      {extraActions}
      <button type="button" onClick={onAction} data-testid="hero-action">
        {actionLabel}
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
    action?: { label: string; onClick: () => void };
  }) => (
    <div data-testid="empty-state">
      <h2>{title}</h2>
      {action ? (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ) : null}
    </div>
  ),
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("./StandaloneChairsSection", () => ({
  default: () => <div data-testid="standalone-chairs-section" />,
}));

vi.mock("./TableConfiguratorModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="table-configurator-modal" /> : null,
}));

vi.mock("./VenueTablesBulkDeleteModal", () => ({
  default: ({ pending }: { pending: unknown }) =>
    pending ? <div data-testid="bulk-delete-modal" /> : null,
}));

vi.mock("./VenueTablesBulkEditPriceModal", () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="bulk-edit-price-modal" /> : null,
}));

vi.mock("./VenueTablesList", () => ({
  default: () => <div data-testid="venue-tables-list" />,
}));

import VenueTablesPageContent from "./VenueTablesPageContent";

describe("VenueTablesPageContent", () => {
  beforeEach(() => {
    mockUseVenueTablesList.mockReturnValue(createMockVenueTablesListState());
  });

  it("renders table seating hero and section tabs", () => {
    renderWithProviders(<VenueTablesPageContent />);
    expect(
      screen.getByRole("heading", { name: "Table seating" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Configure tables with combo pricing/),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tables" })).toBeInTheDocument();
  });

  it("shows loading state while fetching tables", () => {
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ loading: true, items: [] }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    expect(screen.getByText("Loading table configurations…")).toBeInTheDocument();
  });

  it("shows empty state when no active tables", () => {
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({
        items: [],
      }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "No tables configured yet" }),
    ).toBeInTheDocument();
  });

  it("renders list and pagination when tables exist", () => {
    renderWithProviders(<VenueTablesPageContent />);
    expect(screen.getByTestId("venue-tables-list")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All \(1\)/ })).toBeInTheDocument();
  });

  it("switches to standalone chairs section", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("tab", { name: "Standalone chairs" }));
    expect(screen.getByTestId("standalone-chairs-section")).toBeInTheDocument();
    expect(screen.getByTestId("hero-action")).toHaveTextContent("Configure chairs");
  });
});
