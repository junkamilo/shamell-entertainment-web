import { vi } from "vitest";
import { makePaymentsList } from "../fixtures/paymentHistory.fixture";

export function createMockPaymentHistoryPageState(
  overrides: Record<string, unknown> = {},
) {
  const list = makePaymentsList();
  return {
    items: list.items,
    page: 1,
    setPage: vi.fn(),
    perPage: 20,
    setPerPage: vi.fn(),
    flowFilter: "" as const,
    setFlowFilter: vi.fn(),
    statusFilter: "" as const,
    setStatusFilter: vi.fn(),
    search: "",
    setSearch: vi.fn(),
    isLoading: false,
    error: null as string | null,
    meta: list.meta,
    reload: vi.fn(async () => undefined),
    ...overrides,
  };
}
