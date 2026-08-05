import { describe, expect, it } from "vitest";
import {
  makePaginatedResponse,
  makePaginationMeta,
} from "../test/fixtures/sharedLib.fixture";
import {
  FIXTURE_PAGE,
  FIXTURE_PER_PAGE,
  FIXTURE_TOTAL_ITEMS,
} from "../test/fixtures/uuids.fixture";
import {
  DEFAULT_PAGINATION_META,
  PAGINATION_PER_PAGE_OPTIONS,
} from "./pagination";

describe("pagination constants", () => {
  it("exposes default empty-list meta", () => {
    expect(DEFAULT_PAGINATION_META).toEqual({
      page: 1,
      perPage: 10,
      totalItems: 0,
      totalPages: 1,
      hasPrev: false,
      hasNext: false,
    });
  });

  it("exposes per-page options", () => {
    expect(PAGINATION_PER_PAGE_OPTIONS).toEqual([5, 10, 20, 50]);
  });
});

describe("pagination fixtures", () => {
  it("builds meta and paginated responses for callers", () => {
    expect(makePaginationMeta()).toEqual(
      expect.objectContaining({
        page: FIXTURE_PAGE,
        perPage: FIXTURE_PER_PAGE,
        totalItems: FIXTURE_TOTAL_ITEMS,
        hasPrev: true,
        hasNext: true,
      }),
    );

    const page = makePaginatedResponse([{ id: "a" }, { id: "b" }], {
      page: 1,
      perPage: 10,
    });
    expect(page.items).toHaveLength(2);
    expect(page.meta.totalItems).toBe(2);
    expect(page.meta.hasPrev).toBe(false);
  });
});
