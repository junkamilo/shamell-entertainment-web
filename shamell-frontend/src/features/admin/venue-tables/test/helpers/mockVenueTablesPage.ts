import { vi } from "vitest";
import {
  makeStandaloneChairConfig,
  makeVenueTable,
} from "../fixtures/venueTables.fixture";
import { FIXTURE_TABLE_ID_2 } from "../fixtures/uuids.fixture";

export function createMockVenueTablesListState(
  overrides: Record<string, unknown> = {},
) {
  return {
    items: [
      makeVenueTable(),
      makeVenueTable({
        id: FIXTURE_TABLE_ID_2,
        tableName: "Medium 1",
        size: "MEDIUM",
        isActive: false,
      }),
    ],
    loading: false,
    error: null as string | null,
    reload: vi.fn(async () => undefined),
    ...overrides,
  };
}

export function createMockStandaloneChairsPageState(
  overrides: Record<string, unknown> = {},
) {
  const config = makeStandaloneChairConfig();
  return {
    loading: false,
    chairs: config.chairs ?? [],
    unitPrice: config.unitPrice,
    reservedCount: config.reservedCount ?? 0,
    totalCount: config.totalCount ?? 0,
    reload: vi.fn(async () => undefined),
    page: 1,
    setPage: vi.fn(),
    perPage: 10,
    onPerPageChange: vi.fn(),
    pagedChairs: config.chairs ?? [],
    paginationMeta: {
      page: 1,
      perPage: 10,
      totalItems: config.chairs?.length ?? 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    },
    isConfiguratorOpen: false,
    openConfigurator: vi.fn(),
    closeConfigurator: vi.fn(),
    editChair: null,
    openEditPrice: vi.fn(),
    closeEditPrice: vi.fn(),
    bulkEditOpen: false,
    openBulkEdit: vi.fn(),
    closeBulkEdit: vi.fn(),
    deleteAllOpen: false,
    openDeleteAll: vi.fn(),
    closeDeleteAll: vi.fn(),
    ...overrides,
  };
}
