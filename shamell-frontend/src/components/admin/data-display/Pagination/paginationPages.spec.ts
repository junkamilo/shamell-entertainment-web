import { describe, expect, it } from "vitest";
import { normalizeTotalPages, visiblePageNumbers } from "./paginationPages";

describe("normalizeTotalPages", () => {
  it("returns 0 for NaN, Infinity, and negatives", () => {
    expect(normalizeTotalPages(Number.NaN)).toBe(0);
    expect(normalizeTotalPages(Number.POSITIVE_INFINITY)).toBe(0);
    expect(normalizeTotalPages(-3)).toBe(0);
  });

  it("floors finite positives", () => {
    expect(normalizeTotalPages(3.9)).toBe(3);
    expect(normalizeTotalPages(0)).toBe(0);
  });
});

describe("visiblePageNumbers", () => {
  it("returns empty when totalPages is 0", () => {
    expect(visiblePageNumbers(1, 0)).toEqual([]);
  });

  it("returns a window of up to 5 pages without allocating full range", () => {
    expect(visiblePageNumbers(1, 20)).toEqual([1, 2, 3, 4, 5]);
    expect(visiblePageNumbers(10, 20)).toEqual([8, 9, 10, 11, 12]);
    expect(visiblePageNumbers(20, 20)).toEqual([18, 19, 20]);
  });

  it("handles enormous totalPages without throwing", () => {
    const pages = visiblePageNumbers(1, 1_000_000);
    expect(pages).toHaveLength(5);
    expect(pages).toEqual([1, 2, 3, 4, 5]);
  });
});
