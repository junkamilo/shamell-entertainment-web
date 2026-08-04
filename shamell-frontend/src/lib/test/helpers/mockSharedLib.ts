import {
  makeNestErrorPayload,
  makePaginatedResponse,
  makePaginationMeta,
} from "../fixtures/sharedLib.fixture";
import {
  FIXTURE_BACKEND_URL,
  FIXTURE_NEST_FALLBACK,
} from "../fixtures/uuids.fixture";

export function createMockSharedLibState(
  overrides: Record<string, unknown> = {},
) {
  return {
    backendUrl: FIXTURE_BACKEND_URL,
    fallback: FIXTURE_NEST_FALLBACK,
    nestError: makeNestErrorPayload(),
    pagination: makePaginationMeta(),
    page: makePaginatedResponse([{ id: "row-1" }]),
    ...overrides,
  };
}
