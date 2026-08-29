/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockVenueTablesListState } from "../test/helpers/mockVenueTablesPage";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";
import { FIXTURE_TABLE_ID, FIXTURE_TABLE_ID_2 } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { toast } from "@/hooks/use-toast";
import type { VenueTableConfig } from "../types/venueTables.types";
import type { TableSize } from "../types/venueTables.types";

const mockUseVenueTablesList = vi.fn(() => createMockVenueTablesListState());
const getToken = vi.hoisted(() => vi.fn(() => "test-token"));
const deleteTable = vi.hoisted(() => vi.fn());
const deleteBulk = vi.hoisted(() => vi.fn());
const patchBulkPrice = vi.hoisted(() => vi.fn());

vi.mock("../hooks/useVenueTablesList", () => ({
  useVenueTablesList: () => mockUseVenueTablesList(),
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/admin/auth", () => ({
  getAdminBearerToken: () => getToken(),
}));

vi.mock("../services/deleteAdminVenueTable", () => ({
  deleteAdminVenueTable: (...args: unknown[]) => deleteTable(...args),
}));

vi.mock("../services/deleteAdminVenueTablesBulk", () => ({
  deleteAdminVenueTablesBulk: (...args: unknown[]) => deleteBulk(...args),
}));

vi.mock("../services/patchAdminVenueTablesBulkPrice", () => ({
  patchAdminVenueTablesBulkPrice: (...args: unknown[]) => patchBulkPrice(...args),
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
  Pagination: ({
    onPageChange,
    onPerPageChange,
  }: {
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
  }) => (
    <div data-testid="pagination">
      <button type="button" onClick={() => onPageChange?.(2)}>
        page-2
      </button>
      <button type="button" onClick={() => onPerPageChange?.(50)}>
        per-page
      </button>
    </div>
  ),
}));

vi.mock("./StandaloneChairsSection", () => ({
  default: ({
    modalOpen,
    onModalOpenChange,
  }: {
    modalOpen: boolean;
    onModalOpenChange: (open: boolean) => void;
  }) => (
    <div data-testid="standalone-chairs-section">
      {modalOpen ? <span>chairs-modal-open</span> : null}
      <button type="button" onClick={() => onModalOpenChange(true)}>
        open-chairs-from-section
      </button>
    </div>
  ),
}));

vi.mock("./TableConfiguratorModal", () => ({
  default: ({
    open,
    editing,
    onClose,
    onSaved,
  }: {
    open: boolean;
    editing: VenueTableConfig | null;
    onClose: () => void;
    onSaved: () => void;
  }) =>
    open ? (
      <div data-testid="table-configurator-modal">
        <span>{editing ? `editing-${editing.id}` : "creating"}</span>
        <button type="button" onClick={onClose}>
          close-configurator
        </button>
        <button type="button" onClick={onSaved}>
          saved
        </button>
      </div>
    ) : null,
}));

vi.mock("./VenueTablesBulkDeleteModal", () => ({
  default: ({
    pending,
    isDeleting,
    onClose,
    onConfirm,
  }: {
    pending: unknown;
    isDeleting: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    pending ? (
      <div data-testid="bulk-delete-modal">
        {isDeleting ? <span>deleting</span> : null}
        <button type="button" onClick={onConfirm}>
          confirm-bulk-delete
        </button>
        <button type="button" onClick={onClose}>
          close-bulk-delete
        </button>
      </div>
    ) : null,
}));

vi.mock("./VenueTablesBulkEditPriceModal", () => ({
  default: ({
    open,
    bundlePriceInput,
    onBundlePriceChange,
    isSaving,
    onClose,
    onConfirm,
  }: {
    open: boolean;
    bundlePriceInput: string;
    onBundlePriceChange: (value: string) => void;
    isSaving: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div data-testid="bulk-edit-price-modal">
        <span>{bundlePriceInput}</span>
        {isSaving ? <span>saving-prices</span> : null}
        <button type="button" onClick={() => onBundlePriceChange("")}>
          clear-price
        </button>
        <button type="button" onClick={() => onBundlePriceChange("199")}>
          set-valid-price
        </button>
        <button type="button" onClick={onConfirm}>
          confirm-bulk-price
        </button>
        <button type="button" onClick={onClose}>
          close-bulk-price
        </button>
      </div>
    ) : null,
}));

vi.mock("./VenueTablesList", () => ({
  default: ({
    visibleItems,
    onEdit,
    onDeactivate,
    onDeleteAll,
    onDeleteSize,
    onBulkEditPrices,
  }: {
    visibleItems: VenueTableConfig[];
    onEdit: (item: VenueTableConfig) => void;
    onDeactivate: (item: VenueTableConfig) => void;
    onDeleteAll: () => void;
    onDeleteSize: (size: TableSize) => void;
    onBulkEditPrices: () => void;
  }) => (
    <div data-testid="venue-tables-list">
      <button type="button" onClick={() => onEdit(visibleItems[0]!)}>
        edit
      </button>
      <button type="button" onClick={() => onDeactivate(visibleItems[0]!)}>
        deactivate
      </button>
      <button type="button" onClick={onDeleteAll}>
        delete-all
      </button>
      <button type="button" onClick={() => onDeleteSize("LARGE")}>
        delete-size
      </button>
      <button type="button" onClick={() => onDeleteSize("SMALL")}>
        delete-size-empty
      </button>
      <button type="button" onClick={onBulkEditPrices}>
        bulk-edit
      </button>
    </div>
  ),
}));

import VenueTablesPageContent from "./VenueTablesPageContent";

function manyTables(count: number, size: TableSize = "LARGE") {
  return Array.from({ length: count }, (_, i) =>
    makeVenueTable({
      id: `vt-many-${i}`,
      tableName: `${size} ${i + 1}`,
      displayLabel: `${size} ${i + 1}`,
      size,
      isActive: true,
    }),
  );
}

describe("VenueTablesPageContent", () => {
  beforeEach(() => {
    getToken.mockReturnValue("test-token");
    deleteTable.mockReset();
    deleteBulk.mockReset();
    patchBulkPrice.mockReset();
    vi.mocked(toast).mockReset();
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

  it("retries after a list error", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => undefined);
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({
        items: [],
        error: "boom",
        reload,
      }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    expect(screen.getByText("boom")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(reload).toHaveBeenCalled();
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

  it("opens the configurator from empty state and hero", async () => {
    const user = userEvent.setup();
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ items: [] }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(
      screen.getByTestId("empty-state").querySelector("button")!,
    );
    expect(screen.getByTestId("table-configurator-modal")).toHaveTextContent("creating");
    await user.click(screen.getByRole("button", { name: "close-configurator" }));
    expect(screen.queryByTestId("table-configurator-modal")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("hero-action"));
    expect(screen.getByTestId("table-configurator-modal")).toBeInTheDocument();
  });

  it("renders list and pagination when tables exist", () => {
    renderWithProviders(<VenueTablesPageContent />);
    expect(screen.getByTestId("venue-tables-list")).toBeInTheDocument();
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /All \(1\)/ })).toBeInTheDocument();
  });

  it("filters by size chips and resets a stale filter", async () => {
    const user = userEvent.setup();
    const large = makeVenueTable({ isActive: true });
    const small = makeVenueTable({
      id: "vt-small",
      tableName: "Small 1",
      displayLabel: "Small 1",
      size: "SMALL",
      isActive: true,
    });
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ items: [large, small] }),
    );
    const { rerender } = renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: /Small \(1\)/ }));
    expect(screen.getByRole("button", { name: /Small \(1\)/ })).toHaveClass("bg-gold/15");
    await user.click(screen.getByRole("button", { name: /All \(2\)/ }));
    await user.click(screen.getByRole("button", { name: /Small \(1\)/ }));
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ items: [large] }),
    );
    rerender(<VenueTablesPageContent />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /All \(1\)/ })).toHaveClass("bg-gold/15");
    });
  });

  it("paginates and changes page size", async () => {
    const user = userEvent.setup();
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ items: manyTables(11) }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "page-2" }));
    await user.click(screen.getByRole("button", { name: "per-page" }));
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
  });

  it("clamps the page when the list shrinks", async () => {
    const user = userEvent.setup();
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ items: manyTables(11) }),
    );
    const { rerender } = renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "page-2" }));
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ items: [makeVenueTable()] }),
    );
    rerender(<VenueTablesPageContent />);
    expect(screen.getByTestId("venue-tables-list")).toBeInTheDocument();
  });

  it("edits a table and reloads after save", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => undefined);
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ reload }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "edit" }));
    expect(screen.getByText(`editing-${FIXTURE_TABLE_ID}`)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "saved" }));
    expect(reload).toHaveBeenCalled();
  });

  it("deactivates a table", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => undefined);
    deleteTable.mockResolvedValue({ ok: true, status: 200 });
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({ reload }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "deactivate" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Table deactivated" }),
      );
    });
    expect(reload).toHaveBeenCalled();
  });

  it("toasts when deactivate fails and skips without a token", async () => {
    const user = userEvent.setup();
    deleteTable.mockResolvedValue({ ok: false, status: 500 });
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "deactivate" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Could not deactivate table" }),
      );
    });
    getToken.mockReturnValue(null as never);
    deleteTable.mockClear();
    await user.click(screen.getByRole("button", { name: "deactivate" }));
    expect(deleteTable).not.toHaveBeenCalled();
  });

  it("bulk-deletes all tables", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => undefined);
    deleteBulk.mockResolvedValue({ ok: true, status: 200, deletedCount: 2 });
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({
        items: [
          makeVenueTable(),
          makeVenueTable({
            id: FIXTURE_TABLE_ID_2,
            tableName: "Large 2",
            size: "LARGE",
            isActive: true,
          }),
        ],
        reload,
      }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "delete-all" }));
    expect(screen.getByTestId("bulk-delete-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-bulk-delete" }));
    expect(screen.queryByTestId("bulk-delete-modal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "delete-all" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-delete" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Tables deleted" }),
      );
    });
    expect(reload).toHaveBeenCalled();
    expect(deleteBulk).toHaveBeenCalledWith("test-token", { scope: "ALL" });
  });

  it("bulk-deletes by size and ignores empty scopes", async () => {
    const user = userEvent.setup();
    deleteBulk.mockResolvedValue({ ok: true, status: 200 });
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "delete-size-empty" }));
    expect(screen.queryByTestId("bulk-delete-modal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "delete-size" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-delete" }));
    await waitFor(() => {
      expect(deleteBulk).toHaveBeenCalledWith("test-token", {
        scope: "SIZE",
        size: "LARGE",
      });
    });
  });

  it("handles bulk delete failure, missing token, and close while deleting", async () => {
    const user = userEvent.setup();
    deleteBulk.mockResolvedValue({ ok: false, status: 500 });
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "delete-all" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-delete" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Bulk delete failed" }),
      );
    });

    getToken.mockReturnValue(null as never);
    deleteBulk.mockClear();
    await user.click(screen.getByRole("button", { name: "delete-all" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-delete" }));
    expect(deleteBulk).not.toHaveBeenCalled();

    getToken.mockReturnValue("test-token");
    let resolveDelete!: (value: { ok: true; status: number }) => void;
    deleteBulk.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    );
    await user.click(screen.getByRole("button", { name: "delete-all" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-delete" }));
    expect(await screen.findByText("deleting")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-bulk-delete" }));
    expect(screen.getByTestId("bulk-delete-modal")).toBeInTheDocument();
    resolveDelete({ ok: true, status: 200 });
    await waitFor(() => {
      expect(screen.queryByTestId("bulk-delete-modal")).not.toBeInTheDocument();
    });
  });

  it("blocks bulk price edit until a size is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: "bulk-edit" }));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Select a size first" }),
    );
  });

  it("opens bulk price edit, validates, and saves", async () => {
    const user = userEvent.setup();
    const reload = vi.fn(async () => undefined);
    patchBulkPrice.mockResolvedValue({
      ok: true,
      status: 200,
      data: {},
    });
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({
        items: [
          makeVenueTable(),
          makeVenueTable({
            id: FIXTURE_TABLE_ID_2,
            tableName: "Small 1",
            size: "SMALL",
            isActive: true,
          }),
        ],
        reload,
      }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: /Large \(1\)/ }));
    await user.click(screen.getByRole("button", { name: "bulk-edit" }));
    expect(screen.getByTestId("bulk-edit-price-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-bulk-price" }));
    expect(screen.queryByTestId("bulk-edit-price-modal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "bulk-edit" }));
    await user.click(screen.getByRole("button", { name: "clear-price" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-price" }));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Enter a valid price" }),
    );
    await user.click(screen.getByRole("button", { name: "set-valid-price" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-price" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "All prices updated" }),
      );
    });
    expect(reload).toHaveBeenCalled();
  });

  it("handles bulk price failure, missing token, plural copy, and close while saving", async () => {
    const user = userEvent.setup();
    patchBulkPrice.mockResolvedValue({
      ok: false,
      status: 500,
      data: { message: "nope" },
    });
    mockUseVenueTablesList.mockReturnValue(
      createMockVenueTablesListState({
        items: [
          makeVenueTable(),
          makeVenueTable({
            id: "vt-l2",
            tableName: "Large 2",
            size: "LARGE",
            isActive: true,
          }),
        ],
      }),
    );
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("button", { name: /Large \(2\)/ }));
    await user.click(screen.getByRole("button", { name: "bulk-edit" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-price" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Could not update prices" }),
      );
    });

    getToken.mockReturnValue(null as never);
    patchBulkPrice.mockClear();
    await user.click(screen.getByRole("button", { name: "confirm-bulk-price" }));
    expect(patchBulkPrice).not.toHaveBeenCalled();

    getToken.mockReturnValue("test-token");
    patchBulkPrice.mockResolvedValue({
      ok: true,
      status: 200,
      updatedCount: 2,
      data: {},
    });
    await user.click(screen.getByRole("button", { name: "confirm-bulk-price" }));
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.stringMatching(/2 large tables/),
        }),
      );
    });

    let resolvePatch!: (value: { ok: true; status: number; updatedCount: number; data: object }) => void;
    patchBulkPrice.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve;
        }),
    );
    await user.click(screen.getByRole("button", { name: "bulk-edit" }));
    await user.click(screen.getByRole("button", { name: "confirm-bulk-price" }));
    expect(await screen.findByText("saving-prices")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-bulk-price" }));
    expect(screen.getByTestId("bulk-edit-price-modal")).toBeInTheDocument();
    resolvePatch({ ok: true, status: 200, updatedCount: 2, data: {} });
    await waitFor(() => {
      expect(screen.queryByTestId("bulk-edit-price-modal")).not.toBeInTheDocument();
    });
  });

  it("switches to standalone chairs section", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueTablesPageContent />);
    await user.click(screen.getByRole("tab", { name: "Standalone chairs" }));
    expect(screen.getByTestId("standalone-chairs-section")).toBeInTheDocument();
    expect(screen.getByTestId("hero-action")).toHaveTextContent("Configure chairs");
    await user.click(screen.getByTestId("hero-action"));
    expect(screen.getByText("chairs-modal-open")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "open-chairs-from-section" }));
    expect(screen.getByText("chairs-modal-open")).toBeInTheDocument();
  });
});
