/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeStandaloneChairConfig,
  makeStandaloneChairItem,
} from "../test/fixtures/venueTables.fixture";
import { createMockStandaloneChairsPageState } from "../test/helpers/mockVenueTablesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import type { StandaloneChairInventoryItem } from "../types/standaloneChairs.types";

const useStandaloneChairsPageMock = vi.fn();

vi.mock("../hooks/useStandaloneChairsPage", () => ({
  useStandaloneChairsPage: (...args: unknown[]) =>
    useStandaloneChairsPageMock(...args),
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

vi.mock("@/components/admin/overlays", () => ({
  ConfirmDeleteMessage: ({
    name,
    meta,
  }: {
    name: string;
    meta?: string;
  }) => (
    <div data-testid="confirm-delete-message">
      {name}
      {meta}
    </div>
  ),
  ConfirmDeleteModal: ({
    isOpen,
    children,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    children?: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
  }) => (
    <div data-testid="confirm-delete-modal">
      {isOpen ? <span>delete-chair-open</span> : null}
      {children}
      <button type="button" onClick={onClose}>
        close-delete-chair
      </button>
      <button type="button" onClick={onConfirm}>
        confirm-delete-chair
      </button>
    </div>
  ),
  BlockedActionModal: ({
    isOpen,
    title,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="blocked-modal">
        <p>{title}</p>
        <button type="button" onClick={onClose}>
          close-blocked
        </button>
      </div>
    ) : null,
}));

vi.mock("./StandaloneChairsConfiguratorModal", () => ({
  default: ({
    open,
    onClose,
    onSaved,
  }: {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
  }) =>
    open ? (
      <div data-testid="configurator-modal">
        <button type="button" onClick={onClose}>
          close-configurator
        </button>
        <button type="button" onClick={onSaved}>
          saved-configurator
        </button>
      </div>
    ) : null,
}));

vi.mock("./StandaloneChairEditPriceModal", () => ({
  default: ({
    chair,
    onUnitPriceChange,
    onClose,
    onConfirm,
  }: {
    chair: StandaloneChairInventoryItem | null;
    onUnitPriceChange: (value: string) => void;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    chair ? (
      <div data-testid="edit-price-modal">
        <button type="button" onClick={() => onUnitPriceChange("40")}>
          change-edit-price
        </button>
        <button type="button" onClick={onClose}>
          close-edit-price
        </button>
        <button type="button" onClick={onConfirm}>
          confirm-edit-price
        </button>
      </div>
    ) : null,
}));

vi.mock("./StandaloneChairsBulkEditPriceModal", () => ({
  default: ({
    open,
    onUnitPriceChange,
    onClose,
    onConfirm,
  }: {
    open: boolean;
    onUnitPriceChange: (value: string) => void;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div data-testid="bulk-edit-modal">
        <button type="button" onClick={() => onUnitPriceChange("22")}>
          change-bulk-price
        </button>
        <button type="button" onClick={onClose}>
          close-bulk
        </button>
        <button type="button" onClick={onConfirm}>
          confirm-bulk
        </button>
      </div>
    ) : null,
}));

vi.mock("./StandaloneChairsDeleteAllModal", () => ({
  default: ({
    open,
    onClose,
    onConfirm,
  }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    open ? (
      <div data-testid="delete-all-modal">
        <button type="button" onClick={onClose}>
          close-delete-all
        </button>
        <button type="button" onClick={onConfirm}>
          confirm-delete-all
        </button>
      </div>
    ) : null,
}));

vi.mock("./StandaloneChairsMobileCard", () => ({
  default: ({
    item,
    onEdit,
    onDelete,
  }: {
    item: StandaloneChairInventoryItem;
    onEdit: (chair: StandaloneChairInventoryItem) => void;
    onDelete: (chair: StandaloneChairInventoryItem) => void;
  }) => (
    <div data-testid={`mobile-card-${item.id}`}>
      <button type="button" onClick={() => onEdit(item)}>
        mobile-edit
      </button>
      <button type="button" onClick={() => onDelete(item)}>
        mobile-delete
      </button>
    </div>
  ),
}));

vi.mock("./StandaloneChairsTable", () => ({
  default: ({
    chairs,
    onEdit,
    onDelete,
  }: {
    chairs: StandaloneChairInventoryItem[];
    onEdit: (chair: StandaloneChairInventoryItem) => void;
    onDelete: (chair: StandaloneChairInventoryItem) => void;
  }) => (
    <div data-testid="chairs-table">
      {chairs.map((chair) => (
        <div key={chair.id}>
          <button type="button" onClick={() => onEdit(chair)}>
            table-edit
          </button>
          <button type="button" onClick={() => onDelete(chair)}>
            table-delete
          </button>
        </div>
      ))}
    </div>
  ),
}));

import StandaloneChairsSection from "./StandaloneChairsSection";

function buildPageState(overrides: Record<string, unknown> = {}) {
  const { config: configOverride, ...restOverrides } = overrides;
  const base = createMockStandaloneChairsPageState(restOverrides);
  const config = makeStandaloneChairConfig({
    chairs: (base.chairs as ReturnType<typeof makeStandaloneChairItem>[]) ?? [],
    unitPrice: base.unitPrice as number,
    reservedCount: base.reservedCount as number,
    ...(configOverride as Record<string, unknown> | undefined),
  });

  return {
    config: {
      ...config,
      loading: base.loading,
      reload: base.reload,
    },
    addModalOpen: false,
    onAddModalOpenChange: vi.fn(),
    blockedWarning: {
      isOpen: false,
      closeWarning: vi.fn(),
      title: "",
      description: "",
    },
    paginationMeta: base.paginationMeta,
    pagedChairs: base.pagedChairs,
    setPage: base.setPage,
    setPerPage: vi.fn(),
    editChair: null,
    setEditChair: vi.fn(),
    bulkEditOpen: base.bulkEditOpen,
    setBulkEditOpen: vi.fn(),
    deleteChair: null,
    setDeleteChair: vi.fn(),
    deleteAllOpen: base.deleteAllOpen,
    setDeleteAllOpen: vi.fn(),
    editPriceInput: "35",
    setEditPriceInput: vi.fn(),
    bulkPriceInput: "35",
    setBulkPriceInput: vi.fn(),
    savingEdit: false,
    savingBulkEdit: false,
    deletingOne: false,
    deletingAll: false,
    openEditChair: vi.fn(),
    openDeleteChair: vi.fn(),
    openBulkEdit: base.openBulkEdit,
    openDeleteAll: base.openDeleteAll,
    confirmEditChair: vi.fn(),
    confirmBulkEdit: vi.fn(),
    confirmDeleteChair: vi.fn(),
    confirmDeleteAll: vi.fn(),
    ...restOverrides,
  };
}

describe("StandaloneChairsSection", () => {
  beforeEach(() => {
    useStandaloneChairsPageMock.mockReset();
  });

  it("shows loading state while config is loading", () => {
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        loading: true,
        config: { chairs: [], reservedCount: 0 },
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(
      screen.getByText("Loading standalone chair configuration…"),
    ).toBeInTheDocument();
  });

  it("shows empty state and opens the configurator from the action", async () => {
    const user = userEvent.setup();
    const onModalOpenChange = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        config: makeStandaloneChairConfig({ chairs: [], reservedCount: 0 }),
        chairs: [],
        pagedChairs: [],
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection
        modalOpen={false}
        onModalOpenChange={onModalOpenChange}
      />,
    );

    expect(screen.getByText("No standalone chairs yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Configure chairs" }));
    expect(onModalOpenChange).toHaveBeenCalledWith(true);
  });

  it("renders inventory with reserved count and toolbar", async () => {
    const user = userEvent.setup();
    const openBulkEdit = vi.fn();
    const openDeleteAll = vi.fn();
    const chairs = makeStandaloneChairConfig().chairs ?? [];
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
        openBulkEdit,
        openDeleteAll,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByText(/Inventory \(2 · 1 reserved\)/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit all prices" }));
    expect(openBulkEdit).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Delete all chairs" }));
    expect(openDeleteAll).toHaveBeenCalled();
  });

  it("omits reserved copy when none are reserved", () => {
    const chairs = [makeStandaloneChairItem()];
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
        reservedCount: 0,
        config: { chairs, reservedCount: 0 },
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("Inventory (1)")).toBeInTheDocument();
  });

  it("wires table and mobile card edit/delete", async () => {
    const user = userEvent.setup();
    const chair = makeStandaloneChairItem();
    const openEditChair = vi.fn();
    const openDeleteChair = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs: [chair],
        pagedChairs: [chair],
        reservedCount: 0,
        openEditChair,
        openDeleteChair,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByTestId(`mobile-card-${chair.id}`)).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "mobile-edit" })[0]);
    expect(openEditChair).toHaveBeenCalledWith(chair);
    await user.click(screen.getAllByRole("button", { name: "mobile-delete" })[0]);
    expect(openDeleteChair).toHaveBeenCalledWith(chair);
    await user.click(screen.getAllByRole("button", { name: "table-edit" })[0]);
    expect(openEditChair).toHaveBeenCalledWith(chair);
    await user.click(screen.getAllByRole("button", { name: "table-delete" })[0]);
    expect(openDeleteChair).toHaveBeenCalledWith(chair);
  });

  it("shows pagination and changes page and per-page", async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    const setPerPage = vi.fn();
    const chairs = Array.from({ length: 11 }, (_, i) =>
      makeStandaloneChairItem({ id: `chair-${i}`, sortOrder: i }),
    );
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs.slice(0, 10),
        reservedCount: 0,
        setPage,
        setPerPage,
        config: { chairs, reservedCount: 0 },
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "page-2" }));
    expect(setPage).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole("button", { name: "per-page" }));
    expect(setPerPage).toHaveBeenCalledWith(50);
    expect(setPage).toHaveBeenCalledWith(1);
  });

  it("closes and saves the configurator modal", async () => {
    const user = userEvent.setup();
    const onModalOpenChange = vi.fn();
    const reload = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs: [],
        pagedChairs: [],
        reload,
        config: { chairs: [], reservedCount: 0, reload },
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection
        modalOpen
        onModalOpenChange={onModalOpenChange}
      />,
    );

    expect(useStandaloneChairsPageMock).toHaveBeenCalledWith({
      addModalOpen: true,
      onAddModalOpenChange: onModalOpenChange,
    });
    await user.click(screen.getByRole("button", { name: "close-configurator" }));
    expect(onModalOpenChange).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("button", { name: "saved-configurator" }));
    expect(reload).toHaveBeenCalled();
  });

  it("wires edit-price modal callbacks", async () => {
    const user = userEvent.setup();
    const chair = makeStandaloneChairItem();
    const setEditPriceInput = vi.fn();
    const setEditChair = vi.fn();
    const confirmEditChair = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs: [chair],
        pagedChairs: [chair],
        reservedCount: 0,
        editChair: chair,
        setEditPriceInput,
        setEditChair,
        confirmEditChair,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "change-edit-price" }));
    expect(setEditPriceInput).toHaveBeenCalledWith("40");
    await user.click(screen.getByRole("button", { name: "close-edit-price" }));
    expect(setEditChair).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole("button", { name: "confirm-edit-price" }));
    expect(confirmEditChair).toHaveBeenCalled();
  });

  it("wires bulk-edit modal callbacks", async () => {
    const user = userEvent.setup();
    const chairs = [makeStandaloneChairItem()];
    const setBulkPriceInput = vi.fn();
    const setBulkEditOpen = vi.fn();
    const confirmBulkEdit = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
        reservedCount: 0,
        bulkEditOpen: true,
        setBulkPriceInput,
        setBulkEditOpen,
        confirmBulkEdit,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "change-bulk-price" }));
    expect(setBulkPriceInput).toHaveBeenCalledWith("22");
    await user.click(screen.getByRole("button", { name: "close-bulk" }));
    expect(setBulkEditOpen).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("button", { name: "confirm-bulk" }));
    expect(confirmBulkEdit).toHaveBeenCalled();
  });

  it("shows delete-chair copy for a floor-plan chair and confirms", async () => {
    const user = userEvent.setup();
    const chair = makeStandaloneChairItem({
      displayLabel: "Front chair",
      isOnFloorPlan: true,
    });
    const setDeleteChair = vi.fn();
    const confirmDeleteChair = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs: [chair],
        pagedChairs: [chair],
        reservedCount: 0,
        deleteChair: chair,
        setDeleteChair,
        confirmDeleteChair,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("delete-chair-open")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-delete-message")).toHaveTextContent(
      /on floor layout/,
    );
    await user.click(screen.getByRole("button", { name: "close-delete-chair" }));
    expect(setDeleteChair).toHaveBeenCalledWith(null);
    await user.click(
      screen.getByRole("button", { name: "confirm-delete-chair" }),
    );
    expect(confirmDeleteChair).toHaveBeenCalled();
  });

  it("omits floor-layout copy when the chair is not placed", () => {
    const chair = makeStandaloneChairItem({ isOnFloorPlan: false });
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs: [chair],
        pagedChairs: [chair],
        reservedCount: 0,
        deleteChair: chair,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByTestId("confirm-delete-message")).not.toHaveTextContent(
      /on floor layout/,
    );
  });

  it("wires delete-all modal callbacks", async () => {
    const user = userEvent.setup();
    const chairs = [makeStandaloneChairItem()];
    const setDeleteAllOpen = vi.fn();
    const confirmDeleteAll = vi.fn();
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
        reservedCount: 0,
        deleteAllOpen: true,
        setDeleteAllOpen,
        confirmDeleteAll,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "close-delete-all" }));
    expect(setDeleteAllOpen).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("button", { name: "confirm-delete-all" }));
    expect(confirmDeleteAll).toHaveBeenCalled();
  });

  it("shows the blocked-action warning", async () => {
    const user = userEvent.setup();
    const closeWarning = vi.fn();
    const chairs = [makeStandaloneChairItem()];
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
        reservedCount: 0,
        blockedWarning: {
          isOpen: true,
          closeWarning,
          title: "Cannot delete",
          description: "Reserved",
        },
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("Cannot delete")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-blocked" }));
    expect(closeWarning).toHaveBeenCalled();
  });
});
