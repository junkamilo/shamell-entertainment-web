import { vi } from "vitest";

export function createMockAgendaCatalogMapsState(
  overrides: Record<string, unknown> = {},
) {
  return {
    serviceByInquiryCode: new Map([["SHOW", "svc-1"]]),
    eventTypeContactCodeById: new Map([["et-1", "PRIVATE"]]),
    inquiryCodeByCatalogLineId: new Map([["line-1", "GUIDANCE"]]),
    fallbackServiceId: "svc-1" as string | undefined,
    loading: false,
    ...overrides,
  };
}

export function createMockFetchAgendaCatalogMaps(
  result: Record<string, unknown> = {
    services: [],
    eventTypes: [],
  },
) {
  return vi.fn(async () => result);
}
