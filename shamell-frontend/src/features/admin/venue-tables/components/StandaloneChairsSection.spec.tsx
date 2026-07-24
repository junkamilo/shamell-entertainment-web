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

const useStandaloneChairsPageMock = vi.fn();

vi.mock("../hooks/useStandaloneChairsPage", () => ({
  useStandaloneChairsPage: (...args: unknown[]) => useStandaloneChairsPageMock(...args),
}));

vi.mock("./StandaloneChairsConfiguratorModal", () => ({
  default: () => <div data-testid="configurator-modal" />,
}));

vi.mock("./StandaloneChairEditPriceModal", () => ({
  default: () => <div data-testid="edit-price-modal" />,
}));

vi.mock("./StandaloneChairsBulkEditPriceModal", () => ({
  default: () => <div data-testid="bulk-edit-modal" />,
}));

vi.mock("./StandaloneChairsDeleteAllModal", () => ({
  default: () => <div data-testid="delete-all-modal" />,
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

  it("shows empty state when there are no chairs", () => {
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        config: makeStandaloneChairConfig({ chairs: [], reservedCount: 0 }),
        chairs: [],
        pagedChairs: [],
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByText("No standalone chairs yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Configure chairs" }),
    ).toBeInTheDocument();
  });

  it("renders inventory header and toolbar when chairs exist", () => {
    const chairs = makeStandaloneChairConfig().chairs ?? [];
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    expect(screen.getByText(/Inventory \(2 · 1 reserved\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit all prices" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete all chairs" })).toBeInTheDocument();
  });

  it("calls openBulkEdit when Edit all prices is clicked", async () => {
    const user = userEvent.setup();
    const openBulkEdit = vi.fn();
    const chairs = [makeStandaloneChairItem()];
    useStandaloneChairsPageMock.mockReturnValue(
      buildPageState({
        chairs,
        pagedChairs: chairs,
        openBulkEdit,
      }),
    );

    renderWithProviders(
      <StandaloneChairsSection modalOpen={false} onModalOpenChange={vi.fn()} />,
    );

    await user.click(screen.getByRole("button", { name: "Edit all prices" }));
    expect(openBulkEdit).toHaveBeenCalled();
  });
});
