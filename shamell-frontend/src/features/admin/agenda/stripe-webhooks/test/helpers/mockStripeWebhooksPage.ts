import { vi } from "vitest";
import { makeWebhooksList } from "../fixtures/stripeWebhooks.fixture";

export function createMockStripeWebhooksPageState(
  overrides: Record<string, unknown> = {},
) {
  const list = makeWebhooksList();
  return {
    items: list.items,
    page: 1,
    setPage: vi.fn(),
    perPage: 20,
    setPerPage: vi.fn(),
    statusFilter: "" as const,
    setStatusFilter: vi.fn(),
    flowFilter: "",
    setFlowFilter: vi.fn(),
    failedOnly: false,
    setFailedOnly: vi.fn(),
    isLoading: false,
    error: null as string | null,
    meta: list.meta,
    reload: vi.fn(async () => undefined),
    ...overrides,
  };
}
