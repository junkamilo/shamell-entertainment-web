import type { PaginatedResponse, PaginationMeta } from "../../pagination";
import {
  FIXTURE_NEST_FALLBACK,
  FIXTURE_NEST_STRING_MESSAGE,
  FIXTURE_PAGE,
  FIXTURE_PER_PAGE,
  FIXTURE_TOTAL_ITEMS,
} from "./uuids.fixture";

export function makeNestErrorPayload(
  message: unknown = FIXTURE_NEST_STRING_MESSAGE,
) {
  return { message, statusCode: 400, error: "Bad Request" };
}

export function makePaginationMeta(
  overrides: Partial<PaginationMeta> = {},
): PaginationMeta {
  const totalItems = overrides.totalItems ?? FIXTURE_TOTAL_ITEMS;
  const perPage = overrides.perPage ?? FIXTURE_PER_PAGE;
  const page = overrides.page ?? FIXTURE_PAGE;
  const totalPages =
    overrides.totalPages ?? Math.max(1, Math.ceil(totalItems / perPage));
  return {
    page,
    perPage,
    totalItems,
    totalPages,
    hasPrev: overrides.hasPrev ?? page > 1,
    hasNext: overrides.hasNext ?? page < totalPages,
    ...overrides,
  };
}

export function makePaginatedResponse<T>(
  items: T[],
  metaOverrides: Partial<PaginationMeta> = {},
): PaginatedResponse<T> {
  return {
    items,
    meta: makePaginationMeta({
      totalItems: items.length,
      ...metaOverrides,
    }),
  };
}

export function makeCnClassList() {
  return ["px-2", "px-4", false && "hidden", "text-sm"] as const;
}

export { FIXTURE_NEST_FALLBACK };
